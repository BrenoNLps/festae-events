import {
    createEvent,
    getEvents,
    searchEvents,
    getEventsByOrganizer,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventsByFriends,
} from '@/app/lib/services/database/eventService'
import { EventCategory } from '@/app/lib/types'

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'ilike', 'in', 'limit'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    q.single = jest.fn()
    const client = { from: jest.fn().mockReturnValue(q) }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

jest.mock('@/app/lib/services/database/friendshipService')
jest.mock('@/app/lib/utils/date')

import { getFriendIds } from '@/app/lib/services/database/friendshipService'
import { getTodayAsString } from '@/app/lib/utils/date'

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock

const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'ilike', 'in', 'limit']

function mockResolves(value: object) {
    ;(mockQuery as any).then = (resolve: Function) =>
        Promise.resolve(value).then(resolve as any)
}

const endereco = () => ({
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
})

const evento = (overrides = {}) => ({
    id: 1,
    nome: 'Festival de Verão',
    vagas: 100,
    valor: 50,
    data_inicio: '2030-07-01',
    data_fim: '2030-07-02',
    hora_inicio: '18:00',
    hora_fim: '23:00',
    endereco: endereco(),
    id_organizador: 'user-1',
    categoria: EventCategory.FESTA,
    ...overrides,
})

beforeEach(() => {
    jest.resetAllMocks()
    CHAIN.forEach((m) => mockQuery[m].mockReturnValue(mockQuery))
    mockFrom.mockReturnValue(mockQuery)
    delete (mockQuery as any).then
})

describe('createEvent', () => {
    // Happy path: cria evento e retorna o id gerado
    it('cria evento e retorna id gerado pelo banco', async () => {
        const input = { ...evento(), descricao: 'Desc' }
        mockQuery.single.mockResolvedValueOnce({ data: { id: 42 }, error: null })

        const result = await createEvent(input)

        expect(mockFrom).toHaveBeenCalledWith('evento')
        expect(mockQuery.insert).toHaveBeenCalledWith(input)
        expect(mockQuery.select).toHaveBeenCalledWith('id')
        expect(mockQuery.single).toHaveBeenCalled()
        expect(result.data).toEqual({ id: 42 })
        expect(result.error).toBeNull()
    })

    // Edge case: repassa erro do Supabase ao chamador
    it('retorna erro quando a inserção falha', async () => {
        const mockError = new Error('DB error')
        mockQuery.single.mockResolvedValueOnce({ data: null, error: mockError })

        const result = await createEvent(evento())

        expect(result.error).toBe(mockError)
    })
})

describe('getEvents', () => {
    // Happy path: retorna todos os eventos sem filtros
    it('retorna todos os eventos quando sem filtros', async () => {
        const eventos = [evento()]
        mockResolves({ data: eventos, error: null })

        const result = await getEvents()

        expect(mockQuery.select).toHaveBeenCalledWith('*')
        expect(mockQuery.eq).not.toHaveBeenCalled()
        expect(result.data).toEqual(eventos)
    })

    // Happy path: aplica filtro de estado
    it('aplica filtro de estado quando fornecido', async () => {
        mockResolves({ data: [], error: null })

        await getEvents({ estado: 'SP' })

        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>estado', 'SP')
    })

    // Happy path: aplica filtro de cidade
    it('aplica filtro de cidade quando fornecido', async () => {
        mockResolves({ data: [], error: null })

        await getEvents({ cidade: 'São Paulo' })

        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>cidade', 'São Paulo')
    })

    // Happy path: aplica filtro de categoria
    it('aplica filtro de categoria quando fornecido', async () => {
        mockResolves({ data: [], error: null })

        await getEvents({ categoria: EventCategory.SHOW })

        expect(mockQuery.eq).toHaveBeenCalledWith('categoria', EventCategory.SHOW)
    })

    // Happy path: aplica múltiplos filtros simultaneamente
    it('aplica múltiplos filtros ao mesmo tempo', async () => {
        mockResolves({ data: [], error: null })

        await getEvents({ estado: 'SP', cidade: 'São Paulo', categoria: EventCategory.FESTA })

        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>estado', 'SP')
        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>cidade', 'São Paulo')
        expect(mockQuery.eq).toHaveBeenCalledWith('categoria', EventCategory.FESTA)
    })
})

describe('searchEvents', () => {
    // Happy path: busca eventos pelo nome com ilike
    it('busca eventos pelo nome com ilike e limite de 20', async () => {
        const eventos = [evento()]
        mockResolves({ data: eventos, error: null })

        const result = await searchEvents('festival')

        expect(mockQuery.ilike).toHaveBeenCalledWith('nome', '%festival%')
        expect(mockQuery.limit).toHaveBeenCalledWith(20)
        expect(result).toEqual(eventos)
    })

    // Edge case: sem resultados → retorna array vazio
    it('retorna array vazio quando não há resultados', async () => {
        mockResolves({ data: null, error: null })

        const result = await searchEvents('xyzabc')

        expect(result).toEqual([])
    })

    // Happy path: aplica filtros opcionais na busca
    it('aplica filtros de estado e cidade na busca', async () => {
        mockResolves({ data: [], error: null })

        await searchEvents('rock', { estado: 'RJ', cidade: 'Rio de Janeiro' })

        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>estado', 'RJ')
        expect(mockQuery.eq).toHaveBeenCalledWith('endereco->>cidade', 'Rio de Janeiro')
    })
})

describe('getEventsByOrganizer', () => {
    // Happy path: retorna eventos do organizador
    it('retorna eventos do organizador pelo id', async () => {
        const eventos = [evento()]
        mockResolves({ data: eventos, error: null })

        const result = await getEventsByOrganizer('user-1')

        expect(mockQuery.eq).toHaveBeenCalledWith('id_organizador', 'user-1')
        expect(result.data).toEqual(eventos)
    })
})

describe('getEventById', () => {
    // Happy path: retorna evento pelo id
    it('retorna evento pelo id', async () => {
        const e = evento()
        mockQuery.single.mockResolvedValueOnce({ data: e, error: null })

        const result = await getEventById(1)

        expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
        expect(result.data).toEqual(e)
    })

    // Edge case: evento não encontrado → retorna null
    it('retorna data null quando evento não existe', async () => {
        mockQuery.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') })

        const result = await getEventById(999)

        expect(result.data).toBeNull()
    })
})

describe('updateEvent', () => {
    // Happy path: atualiza evento e retorna resultado
    it('atualiza evento com os valores fornecidos', async () => {
        mockResolves({ data: null, error: null })

        const result = await updateEvent(1, { nome: 'Novo Nome', vagas: 200 })

        expect(mockQuery.update).toHaveBeenCalledWith({ nome: 'Novo Nome', vagas: 200 })
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
        expect(result.error).toBeNull()
    })
})

describe('deleteEvent', () => {
    // Happy path: deleta evento pelo id
    it('deleta evento pelo id', async () => {
        mockResolves({ data: null, error: null })

        const result = await deleteEvent(1)

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 1)
        expect(result.error).toBeNull()
    })
})

describe('getEventsByFriends', () => {
    const TODAY = '2025-06-15'

    beforeEach(() => {
        ;(getTodayAsString as jest.Mock).mockReturnValue(TODAY)
    })

    // Edge case: sem amigos → retorna array vazio imediatamente
    it('retorna array vazio quando não há amigos', async () => {
        ;(getFriendIds as jest.Mock).mockResolvedValueOnce([])

        const result = await getEventsByFriends('user-1')

        expect(result).toEqual([])
        expect(mockFrom).not.toHaveBeenCalled()
    })

    // Happy path: retorna eventos futuros dos amigos ordenados por data_inicio
    it('retorna eventos futuros dos amigos ordenados por data_inicio', async () => {
        ;(getFriendIds as jest.Mock).mockResolvedValueOnce(['friend-1', 'friend-2'])
        const e1 = evento({ id: 1, data_inicio: '2025-08-01', data_fim: '2025-08-02' })
        const e2 = evento({ id: 2, data_inicio: '2025-07-01', data_fim: '2025-07-02' })
        mockResolves({ data: [{ evento: e1 }, { evento: e2 }], error: null })

        const result = await getEventsByFriends('user-1')

        expect(result).toHaveLength(2)
        expect(result[0].id).toBe(2) // julho vem antes de agosto
        expect(result[1].id).toBe(1)
    })

    // Edge case: eventos expirados (data_fim < today) são filtrados
    it('exclui eventos já encerrados', async () => {
        ;(getFriendIds as jest.Mock).mockResolvedValueOnce(['friend-1'])
        const passado = evento({ id: 1, data_inicio: '2025-01-01', data_fim: '2025-01-02' })
        const futuro = evento({ id: 2, data_inicio: '2025-07-01', data_fim: '2025-07-02' })
        mockResolves({ data: [{ evento: passado }, { evento: futuro }], error: null })

        const result = await getEventsByFriends('user-1')

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe(2)
    })

    // Edge case: eventos duplicados (mesmo evento inscrito por dois amigos) aparecem uma vez
    it('deduplica eventos quando múltiplos amigos estão inscritos no mesmo evento', async () => {
        ;(getFriendIds as jest.Mock).mockResolvedValueOnce(['friend-1', 'friend-2'])
        const e = evento({ id: 1, data_inicio: '2025-07-01', data_fim: '2025-07-02' })
        mockResolves({ data: [{ evento: e }, { evento: e }], error: null })

        const result = await getEventsByFriends('user-1')

        expect(result).toHaveLength(1)
    })

    // Edge case: consulta a tabela inscricao com os ids dos amigos
    it('consulta inscrições filtrando pelos ids dos amigos', async () => {
        ;(getFriendIds as jest.Mock).mockResolvedValueOnce(['friend-1'])
        mockResolves({ data: [], error: null })

        await getEventsByFriends('user-1')

        expect(mockFrom).toHaveBeenCalledWith('inscricao')
        expect(mockQuery.select).toHaveBeenCalledWith('evento(*)')
        expect(mockQuery.in).toHaveBeenCalledWith('id_usuario', ['friend-1'])
    })
})
