import {
    createRegistration,
    getRegistrationsByUser,
    getRegistrationsByEvent,
    checkRegistration,
    deleteRegistration,
    getRegistrationCount,
} from '@/app/lib/services/database/registrationService'

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'delete', 'eq', 'in'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    q.single = jest.fn()
    q.maybeSingle = jest.fn()
    const client = { from: jest.fn().mockReturnValue(q), rpc: jest.fn() }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock
const mockRpc = mockClient.rpc as jest.Mock

const CHAIN = ['select', 'insert', 'delete', 'eq', 'in']

function mockResolves(value: object) {
    ;(mockQuery as any).then = (resolve: Function) =>
        Promise.resolve(value).then(resolve as any)
}

beforeEach(() => {
    jest.resetAllMocks()
    CHAIN.forEach((m) => mockQuery[m].mockReturnValue(mockQuery))
    mockFrom.mockReturnValue(mockQuery)
    delete (mockQuery as any).then
})

describe('createRegistration', () => {
    // Happy path: insere inscrição e retorna resultado
    it('cria inscrição com id_usuario e id_evento corretos', async () => {
        mockResolves({ data: null, error: null })

        const result = await createRegistration({ id_usuario: 'user-1', id_evento: 42 })

        expect(mockFrom).toHaveBeenCalledWith('inscricao')
        expect(mockQuery.insert).toHaveBeenCalledWith({ id_usuario: 'user-1', id_evento: 42 })
        expect(result.error).toBeNull()
    })

    // Edge case: repassa o erro do Supabase ao chamador
    it('retorna erro quando o Supabase falha', async () => {
        const mockError = new Error('Duplicate key')
        mockResolves({ data: null, error: mockError })

        const result = await createRegistration({ id_usuario: 'user-1', id_evento: 42 })

        expect(result.error).toBe(mockError)
    })
})

describe('getRegistrationsByUser', () => {
    // Happy path: retorna inscrições com dados de evento embutidos
    it('retorna inscrições do usuário com dados de evento', async () => {
        const mockData = [{ id: 1, id_usuario: 'user-1', evento: { id: 42, nome: 'Festival' } }]
        mockResolves({ data: mockData, error: null })

        const result = await getRegistrationsByUser('user-1')

        expect(mockQuery.select).toHaveBeenCalledWith('*, evento(*)')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(result.data).toEqual(mockData)
    })
})

describe('getRegistrationsByEvent', () => {
    // Happy path: retorna inscrições de um evento com dados de usuário embutidos
    it('retorna inscrições do evento com dados de usuário', async () => {
        const mockData = [{ id: 1, id_evento: 42, usuario: { id: 'user-1', username: 'joao' } }]
        mockResolves({ data: mockData, error: null })

        const result = await getRegistrationsByEvent(42)

        expect(mockQuery.select).toHaveBeenCalledWith('*, usuario(*)')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_evento', 42)
        expect(result.data).toEqual(mockData)
    })
})

describe('checkRegistration', () => {
    // Happy path: usuário inscrito → retorna dados com id
    it('retorna dados quando o usuário está inscrito', async () => {
        mockQuery.maybeSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null })

        const result = await checkRegistration('user-1', 42)

        expect(mockQuery.select).toHaveBeenCalledWith('id')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_evento', 42)
        expect(result.data).toEqual({ id: 1 })
    })

    // Edge case: usuário não inscrito → retorna data null
    it('retorna data null quando o usuário não está inscrito', async () => {
        mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

        const result = await checkRegistration('user-1', 99)

        expect(result.data).toBeNull()
    })
})

describe('deleteRegistration', () => {
    // Happy path: remove inscrição com os filtros corretos
    it('deleta inscrição com id_usuario e id_evento corretos', async () => {
        mockResolves({ data: null, error: null })

        const result = await deleteRegistration('user-1', 42)

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_evento', 42)
        expect(result.error).toBeNull()
    })
})

describe('getRegistrationCount', () => {
    // Happy path: retorna a contagem de inscrições via RPC
    it('retorna contagem de inscrições do evento via RPC', async () => {
        mockRpc.mockResolvedValueOnce({ data: 37, error: null })

        const result = await getRegistrationCount(42)

        expect(mockRpc).toHaveBeenCalledWith('get_registration_count', { evento_id: 42 })
        expect(result).toBe(37)
    })

    // Edge case: RPC retorna null → deve retornar 0
    it('retorna 0 quando RPC retorna null', async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null })

        const result = await getRegistrationCount(42)

        expect(result).toBe(0)
    })
})
