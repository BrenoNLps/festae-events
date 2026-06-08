import {
    getUserById,
    completeProfile,
    updateProfile,
    searchUsers,
} from '@/app/lib/services/database/userService'
import { AccountType } from '@/app/lib/types'

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'update', 'eq', 'neq', 'ilike', 'limit'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    q.single = jest.fn()
    const client = { from: jest.fn().mockReturnValue(q) }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock

const CHAIN = ['select', 'update', 'eq', 'neq', 'ilike', 'limit']

function mockResolves(value: object) {
    ;(mockQuery as any).then = (resolve: Function) =>
        Promise.resolve(value).then(resolve as any)
}

const usuario = (overrides = {}) => ({
    id: 'user-1',
    username: 'joao123',
    nome: 'João Silva',
    tipo_conta: AccountType.USUARIO,
    imagem_url: null,
    ...overrides,
})

beforeEach(() => {
    jest.resetAllMocks()
    CHAIN.forEach((m) => mockQuery[m].mockReturnValue(mockQuery))
    mockFrom.mockReturnValue(mockQuery)
    delete (mockQuery as any).then
})

describe('getUserById', () => {
    // Happy path: retorna usuário quando encontrado
    it('retorna usuário pelo id', async () => {
        const user = usuario()
        mockQuery.single.mockResolvedValueOnce({ data: user, error: null })

        const result = await getUserById('user-1')

        expect(mockFrom).toHaveBeenCalledWith('usuario')
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
        expect(result.data).toEqual(user)
    })

    // Edge case: usuário não encontrado → data null
    it('retorna data null quando usuário não existe', async () => {
        mockQuery.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') })

        const result = await getUserById('inexistente')

        expect(result.data).toBeNull()
    })
})

describe('completeProfile', () => {
    // Happy path: atualiza perfil com todos os campos
    it('atualiza perfil do usuário com os valores fornecidos', async () => {
        mockResolves({ data: null, error: null })
        const values = { username: 'novonome', tipo_conta: AccountType.USUARIO as const }

        await completeProfile('user-1', values)

        expect(mockQuery.update).toHaveBeenCalledWith(values)
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
    })

    // Happy path: atualiza perfil de empresa com CNPJ
    it('atualiza perfil de empresa com CNPJ', async () => {
        mockResolves({ data: null, error: null })
        const values = {
            username: 'minhaempresa',
            tipo_conta: AccountType.EMPRESA as const,
            cnpj: '11444777000161',
        }

        const result = await completeProfile('user-1', values)

        expect(mockQuery.update).toHaveBeenCalledWith(values)
        expect(result.error).toBeNull()
    })
})

describe('updateProfile', () => {
    // Happy path: atualiza apenas os campos fornecidos
    it('atualiza nome e imagem_url do usuário', async () => {
        mockResolves({ data: null, error: null })

        await updateProfile('user-1', { nome: 'Novo Nome', imagem_url: 'https://...' })

        expect(mockQuery.update).toHaveBeenCalledWith({ nome: 'Novo Nome', imagem_url: 'https://...' })
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1')
    })
})

describe('searchUsers', () => {
    // Happy path: retorna usuários filtrados pela query
    it('busca usuários pelo username e aplica limite padrão de 5', async () => {
        const users = [usuario({ username: 'joao' })]
        mockResolves({ data: users, error: null })

        const result = await searchUsers('joao')

        expect(mockQuery.ilike).toHaveBeenCalledWith('username', '%joao%')
        expect(mockQuery.limit).toHaveBeenCalledWith(15) // limit padrão 5 * 3
        expect(result).toHaveLength(1)
    })

    // Edge case: exclui o próprio usuário da busca
    it('exclui o usuário especificado em excludeId', async () => {
        mockResolves({ data: [], error: null })

        await searchUsers('joao', 'user-1')

        expect(mockQuery.neq).toHaveBeenCalledWith('id', 'user-1')
    })

    // Edge case: sem resultados → retorna array vazio
    it('retorna array vazio quando Supabase retorna null', async () => {
        mockResolves({ data: null, error: null })

        const result = await searchUsers('ninguem')

        expect(result).toEqual([])
    })

    // Happy path: ordenação — match exato tem prioridade sobre startsWith
    it('ordena: match exato > startsWith > contains', async () => {
        const users = [
            usuario({ username: 'joao_amigo' }),     // starts with 'joao'
            usuario({ id: 'u2', username: 'joao' }), // exact match
            usuario({ id: 'u3', username: 'meu_joao' }), // contains 'joao'
        ]
        mockResolves({ data: users, error: null })

        const result = await searchUsers('joao')

        expect(result[0].username).toBe('joao')        // score 0 (exact)
        expect(result[1].username).toBe('joao_amigo')  // score 1 (startsWith)
        expect(result[2].username).toBe('meu_joao')    // score 2 (contains)
    })

    // Happy path: dentro do mesmo score, username mais curto tem prioridade
    it('desempata por comprimento de username (mais curto primeiro)', async () => {
        const users = [
            usuario({ username: 'joaosilva' }),  // starts with 'joao', len 9
            usuario({ id: 'u2', username: 'joao_s' }), // starts with 'joao', len 6
        ]
        mockResolves({ data: users, error: null })

        const result = await searchUsers('joao')

        expect(result[0].username).toBe('joao_s')
        expect(result[1].username).toBe('joaosilva')
    })

    // Edge case: respeita o limite customizado
    it('respeita o limite personalizado de resultados', async () => {
        const users = Array.from({ length: 10 }, (_, i) =>
            usuario({ id: `u${i}`, username: `user${i}` })
        )
        mockResolves({ data: users, error: null })

        const result = await searchUsers('user', undefined, 3)

        expect(result).toHaveLength(3)
    })
})
