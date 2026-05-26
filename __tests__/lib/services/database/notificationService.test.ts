import {
    getUnreadNotificationCount,
    markNotificationsAsRead,
    insertNotification,
    insertNotificationsForFriends,
} from '@/app/lib/services/database/notificationService'

// Mocks criados DENTRO do factory para evitar temporal dead zone com SWC
jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'update', 'eq', 'in'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    const client = { from: jest.fn().mockReturnValue(q) }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock

const CHAIN = ['select', 'insert', 'update', 'eq', 'in']

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

describe('getUnreadNotificationCount', () => {
    // Happy path: retorna a contagem de notificações não lidas
    it('retorna contagem de notificações de amizade não lidas', async () => {
        mockResolves({ count: 3, data: null, error: null })

        const result = await getUnreadNotificationCount('amizade')

        expect(result).toBe(3)
        expect(mockFrom).toHaveBeenCalledWith('notificacao')
        expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
        expect(mockQuery.eq).toHaveBeenCalledWith('tipo', 'amizade')
        expect(mockQuery.eq).toHaveBeenCalledWith('lida', false)
    })

    // Edge case: count null → deve retornar 0
    it('retorna 0 quando count é null', async () => {
        mockResolves({ count: null, data: null, error: null })

        const result = await getUnreadNotificationCount('evento')

        expect(result).toBe(0)
    })

    // Edge case: nenhuma notificação não lida → retorna 0
    it('retorna 0 quando não há notificações não lidas', async () => {
        mockResolves({ count: 0, data: null, error: null })

        const result = await getUnreadNotificationCount('amizade')

        expect(result).toBe(0)
    })
})

describe('markNotificationsAsRead', () => {
    // Happy path: atualiza notificações de amizade como lidas
    it('marca notificações de amizade como lidas', async () => {
        mockResolves({ data: null, error: null })

        await markNotificationsAsRead('amizade')

        expect(mockFrom).toHaveBeenCalledWith('notificacao')
        expect(mockQuery.update).toHaveBeenCalledWith({ lida: true })
        expect(mockQuery.eq).toHaveBeenCalledWith('tipo', 'amizade')
        expect(mockQuery.eq).toHaveBeenCalledWith('lida', false)
    })

    // Happy path: marca notificações de evento como lidas
    it('marca notificações de evento como lidas', async () => {
        mockResolves({ data: null, error: null })

        await markNotificationsAsRead('evento')

        expect(mockQuery.eq).toHaveBeenCalledWith('tipo', 'evento')
    })
})

describe('insertNotification', () => {
    // Happy path: insere uma notificação para o usuário
    it('insere notificação de amizade para o usuário', async () => {
        mockResolves({ data: null, error: null })

        await insertNotification('user-1', 'amizade')

        expect(mockFrom).toHaveBeenCalledWith('notificacao')
        expect(mockQuery.insert).toHaveBeenCalledWith({ id_usuario: 'user-1', tipo: 'amizade' })
    })
})

describe('insertNotificationsForFriends', () => {
    // Happy path: insere notificação em lote para múltiplos amigos
    it('insere notificações para todos os amigos', async () => {
        mockResolves({ data: null, error: null })
        const friendIds = ['friend-1', 'friend-2', 'friend-3']

        await insertNotificationsForFriends(friendIds, 'evento')

        expect(mockQuery.insert).toHaveBeenCalledWith([
            { id_usuario: 'friend-1', tipo: 'evento' },
            { id_usuario: 'friend-2', tipo: 'evento' },
            { id_usuario: 'friend-3', tipo: 'evento' },
        ])
    })

    // Edge case: lista vazia → não deve chamar supabase
    it('não faz nenhuma chamada quando a lista de amigos é vazia', async () => {
        await insertNotificationsForFriends([], 'evento')

        expect(mockFrom).not.toHaveBeenCalled()
    })
})
