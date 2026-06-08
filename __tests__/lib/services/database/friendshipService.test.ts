import {
    getFriendIds,
    sendFriendRequest,
    getFriends,
    getPendingReceived,
    getPendingSent,
    acceptFriend,
    declineFriend,
    removeFriend,
    getFriendsAtEvent,
} from '@/app/lib/services/database/friendshipService'
import { AccountType } from '@/app/lib/types'

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'or'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    const client = { from: jest.fn().mockReturnValue(q) }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

jest.mock('@/app/lib/services/database/notificationService')

import { insertNotification } from '@/app/lib/services/database/notificationService'

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock

const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'or']

function mockResolves(value: object) {
    ;(mockQuery as any).then = (resolve: Function) =>
        Promise.resolve(value).then(resolve as any)
}

// Configura sequência de resoluções para múltiplas chamadas simultâneas (Promise.all)
function mockResolvesSequence(...values: object[]) {
    let i = 0
    ;(mockQuery as any).then = (resolve: Function) => {
        const value = values[i++] ?? { data: [], error: null }
        return Promise.resolve(value).then(resolve as any)
    }
}

const usuario = (overrides = {}) => ({
    id: 'user-1',
    username: 'joao',
    tipo_conta: AccountType.USUARIO,
    ...overrides,
})

beforeEach(() => {
    jest.resetAllMocks()
    CHAIN.forEach((m) => mockQuery[m].mockReturnValue(mockQuery))
    mockFrom.mockReturnValue(mockQuery)
    delete (mockQuery as any).then
})

describe('getFriendIds', () => {
    // Happy path: combina amigos enviados e recebidos
    it('retorna ids de amigos aceitos de ambas as direções', async () => {
        mockResolvesSequence(
            { data: [{ id_amigo: 'friend-a' }, { id_amigo: 'friend-b' }], error: null },
            { data: [{ id_usuario: 'friend-c' }], error: null }
        )

        const result = await getFriendIds('user-1')

        expect(result).toEqual(['friend-a', 'friend-b', 'friend-c'])
    })

    // Edge case: sem amigos em nenhuma direção → retorna array vazio
    it('retorna array vazio quando não há amigos', async () => {
        mockResolvesSequence(
            { data: [], error: null },
            { data: [], error: null }
        )

        const result = await getFriendIds('user-1')

        expect(result).toEqual([])
    })

    // Happy path: filtra apenas status 'aceito' em ambas as queries
    it('filtra por status aceito nas duas queries', async () => {
        mockResolvesSequence(
            { data: [], error: null },
            { data: [], error: null }
        )

        await getFriendIds('user-1')

        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'aceito')
    })
})

describe('sendFriendRequest', () => {
    // Happy path: insere pedido de amizade e envia notificação
    it('insere pedido de amizade e notifica o destinatário', async () => {
        mockResolves({ data: null, error: null })
        ;(insertNotification as jest.Mock).mockResolvedValueOnce(undefined)

        await sendFriendRequest({ id_usuario: 'user-1', id_amigo: 'user-2' })

        expect(mockQuery.insert).toHaveBeenCalledWith({ id_usuario: 'user-1', id_amigo: 'user-2' })
        expect(insertNotification).toHaveBeenCalledWith('user-2', 'amizade')
    })

    // Edge case: erro no insert → não deve enviar notificação
    it('não envia notificação quando o insert falha', async () => {
        mockResolves({ data: null, error: new Error('Unique violation') })

        await sendFriendRequest({ id_usuario: 'user-1', id_amigo: 'user-2' })

        expect(insertNotification).not.toHaveBeenCalled()
    })
})

describe('getFriends', () => {
    // Happy path: combina amigos de ambas as direções
    it('retorna lista combinada de amigos aceitos', async () => {
        const amigo = usuario({ id: 'friend-1', username: 'amigo1' })
        const remetente = usuario({ id: 'friend-2', username: 'amigo2' })
        mockResolvesSequence(
            { data: [{ amigo }], error: null },
            { data: [{ remetente }], error: null }
        )

        const result = await getFriends('user-1')

        expect(result.data).toHaveLength(2)
        expect(result.data.map((u: any) => u.id)).toContain('friend-1')
        expect(result.data.map((u: any) => u.id)).toContain('friend-2')
    })

    // Edge case: sem amigos → retorna array vazio
    it('retorna array vazio quando não há amigos aceitos', async () => {
        mockResolvesSequence(
            { data: [], error: null },
            { data: [], error: null }
        )

        const result = await getFriends('user-1')

        expect(result.data).toEqual([])
    })
})

describe('getPendingReceived', () => {
    // Happy path: retorna pedidos pendentes recebidos pelo usuário
    it('retorna pedidos de amizade pendentes recebidos', async () => {
        const mockData = [{ remetente: usuario() }]
        mockResolves({ data: mockData, error: null })

        const result = await getPendingReceived('user-1')

        expect(mockQuery.eq).toHaveBeenCalledWith('id_amigo', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pendente')
        expect(result.data).toEqual(mockData)
    })
})

describe('getPendingSent', () => {
    // Happy path: retorna pedidos pendentes enviados pelo usuário
    it('retorna pedidos de amizade pendentes enviados', async () => {
        mockResolves({ data: [], error: null })

        await getPendingSent('user-1')

        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pendente')
    })
})

describe('acceptFriend', () => {
    // Happy path: atualiza status para aceito
    it('atualiza status da amizade para aceito', async () => {
        mockResolves({ data: null, error: null })

        await acceptFriend('user-1', 'user-2')

        expect(mockQuery.update).toHaveBeenCalledWith({ status: 'aceito' })
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_amigo', 'user-2')
    })
})

describe('declineFriend', () => {
    // Happy path: remove o pedido de amizade
    it('remove pedido de amizade ao recusar', async () => {
        mockResolves({ data: null, error: null })

        await declineFriend('user-1', 'user-2')

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_amigo', 'user-2')
    })
})

describe('removeFriend', () => {
    // Happy path: remove amizade em ambas as direções via OR com sintaxe exata do Supabase
    it('remove amizade usando OR para ambas as direções com filtro correto', async () => {
        mockResolves({ data: null, error: null })

        await removeFriend('user-1', 'user-2')

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.or).toHaveBeenCalledWith(
            'and(id_usuario.eq.user-1,id_amigo.eq.user-2),and(id_usuario.eq.user-2,id_amigo.eq.user-1)'
        )
    })

    // Edge case: sentido inverso também é removido (user-2 iniciou, user-1 é amigo)
    it('remove corretamente quando a amizade foi iniciada pelo outro usuário', async () => {
        mockResolves({ data: null, error: null })

        await removeFriend('user-2', 'user-1')

        expect(mockQuery.or).toHaveBeenCalledWith(
            'and(id_usuario.eq.user-2,id_amigo.eq.user-1),and(id_usuario.eq.user-1,id_amigo.eq.user-2)'
        )
    })
})

describe('getFriendsAtEvent', () => {
    // Edge case: sem amigos → retorna array vazio sem consultar inscrições
    it('retorna array vazio quando não há amigos', async () => {
        // Duas queries do Promise.all em getFriendIds, ambas vazias
        mockResolvesSequence(
            { data: [], error: null },
            { data: [], error: null }
        )

        const result = await getFriendsAtEvent('user-1', 42)

        expect(result).toEqual([])
    })

    // Happy path: retorna amigos presentes no evento
    it('retorna amigos inscritos no evento', async () => {
        const amigo = usuario({ id: 'friend-1', username: 'amigo1' })
        // Sequência: getFriendIds (sent), getFriendIds (received), inscrição query
        mockResolvesSequence(
            { data: [{ id_amigo: 'friend-1' }], error: null },
            { data: [], error: null },
            { data: [{ usuario: amigo }], error: null }
        )

        const result = await getFriendsAtEvent('user-1', 42)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('friend-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_evento', 42)
        expect(mockQuery.in).toHaveBeenCalledWith('id_usuario', ['friend-1'])
    })
})
