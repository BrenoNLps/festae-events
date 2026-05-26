import {
    getOrCreateDMConversation,
    createGroup,
    getMyConversations,
    getMessagesByConversation,
    sendMessage,
    markConversationAsRead,
    leaveGroup,
    getUnreadConversationIds,
} from '@/app/lib/services/database/messageService'

jest.mock('@/app/lib/supabase/singleton', () => {
    const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'order'] as const
    const q: Record<string, jest.Mock> = {}
    CHAIN.forEach((m) => { q[m] = jest.fn() })
    CHAIN.forEach((m) => q[m].mockReturnValue(q))
    const client = { from: jest.fn().mockReturnValue(q), rpc: jest.fn() }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockQuery: q }
})

const { __mockClient: mockClient, __mockQuery: mockQuery } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockFrom = mockClient.from as jest.Mock
const mockRpc = mockClient.rpc as jest.Mock

const CHAIN = ['select', 'insert', 'update', 'delete', 'eq', 'order']

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

describe('getOrCreateDMConversation', () => {
    // Happy path: chama RPC e retorna id da conversa
    it('chama RPC criar_conversa_dm e retorna id da conversa', async () => {
        mockRpc.mockResolvedValueOnce({ data: 'conv-uuid-1', error: null })

        const result = await getOrCreateDMConversation('user-2')

        expect(mockRpc).toHaveBeenCalledWith('criar_conversa_dm', {
            outro_usuario: 'user-2',
        })
        expect(result.data).toBe('conv-uuid-1')
        expect(result.error).toBeNull()
    })

    // Edge case: RPC falha → repassa o erro
    it('retorna erro quando o RPC falha', async () => {
        const mockError = new Error('RPC error')
        mockRpc.mockResolvedValueOnce({ data: null, error: mockError })

        const result = await getOrCreateDMConversation('user-2')

        expect(result.data).toBeNull()
        expect(result.error).toBe(mockError)
    })
})

describe('createGroup', () => {
    // Happy path: chama RPC criar_grupo com nome e participantes
    it('chama RPC criar_grupo e retorna id do grupo', async () => {
        mockRpc.mockResolvedValueOnce({ data: 'group-uuid-1', error: null })

        const result = await createGroup('Dev Team', ['user-1', 'user-2', 'user-3'])

        expect(mockRpc).toHaveBeenCalledWith('criar_grupo', {
            nome_grupo: 'Dev Team',
            participantes: ['user-1', 'user-2', 'user-3'],
        })
        expect(result.data).toBe('group-uuid-1')
    })
})

describe('getMyConversations', () => {
    // Happy path: retorna lista de conversas via RPC
    it('retorna lista de conversas do usuário via RPC', async () => {
        const mockConvs = [{ id: 'conv-1', tipo: 'DM' }, { id: 'conv-2', tipo: 'GRUPO' }]
        mockRpc.mockResolvedValueOnce({ data: mockConvs, error: null })

        const result = await getMyConversations()

        expect(mockRpc).toHaveBeenCalledWith('get_my_conversations')
        expect(result.data).toEqual(mockConvs)
    })

    // Edge case: RPC retorna null → deve retornar array vazio
    it('retorna array vazio quando RPC retorna null', async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null })

        const result = await getMyConversations()

        expect(result.data).toEqual([])
    })
})

describe('getMessagesByConversation', () => {
    // Happy path: retorna mensagens ordenadas por data_criacao
    it('retorna mensagens da conversa ordenadas por data de criação', async () => {
        const mockMessages = [
            { id: 'msg-1', conteudo: 'Olá', data_criacao: '2025-01-01T10:00:00Z' },
            { id: 'msg-2', conteudo: 'Tudo bem?', data_criacao: '2025-01-01T10:01:00Z' },
        ]
        mockResolves({ data: mockMessages, error: null })

        const result = await getMessagesByConversation('conv-1')

        expect(mockFrom).toHaveBeenCalledWith('mensagem')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_conversa', 'conv-1')
        expect(mockQuery.order).toHaveBeenCalledWith('data_criacao', { ascending: true })
        expect(result.data).toEqual(mockMessages)
    })

    // Edge case: sem mensagens → retorna null ou array vazio
    it('retorna null quando não há mensagens', async () => {
        mockResolves({ data: null, error: null })

        const result = await getMessagesByConversation('conv-vazia')

        expect(result.data).toBeNull()
    })
})

describe('sendMessage', () => {
    // Happy path: insere mensagem na tabela mensagem
    it('insere mensagem com conteudo, remetente e conversa corretos', async () => {
        mockResolves({ data: null, error: null })

        await sendMessage({
            conteudo: 'Olá!',
            id_remetente: 'user-1',
            id_conversa: 'conv-1',
        })

        expect(mockFrom).toHaveBeenCalledWith('mensagem')
        expect(mockQuery.insert).toHaveBeenCalledWith({
            conteudo: 'Olá!',
            id_remetente: 'user-1',
            id_conversa: 'conv-1',
        })
    })
})

describe('markConversationAsRead', () => {
    // Happy path: atualiza ultima_leitura na tabela conversa_participante
    it('atualiza ultima_leitura da conversa para o usuário', async () => {
        mockResolves({ data: null, error: null })

        await markConversationAsRead('conv-1', 'user-1')

        expect(mockFrom).toHaveBeenCalledWith('conversa_participante')
        expect(mockQuery.update).toHaveBeenCalledWith(
            expect.objectContaining({ ultima_leitura: expect.any(String) })
        )
        expect(mockQuery.eq).toHaveBeenCalledWith('id_conversa', 'conv-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
    })
})

describe('leaveGroup', () => {
    // Happy path: remove o participante da conversa
    it('remove o usuário da conversa ao sair do grupo', async () => {
        mockResolves({ data: null, error: null })

        await leaveGroup('conv-1', 'user-1')

        expect(mockFrom).toHaveBeenCalledWith('conversa_participante')
        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('id_conversa', 'conv-1')
        expect(mockQuery.eq).toHaveBeenCalledWith('id_usuario', 'user-1')
    })
})

describe('getUnreadConversationIds', () => {
    // Happy path: retorna ids de conversas não lidas via RPC
    it('retorna ids de conversas com mensagens não lidas', async () => {
        mockRpc.mockResolvedValueOnce({ data: ['conv-1', 'conv-3'], error: null })

        const result = await getUnreadConversationIds()

        expect(mockRpc).toHaveBeenCalledWith('get_unread_conversation_ids')
        expect(result.data).toEqual(['conv-1', 'conv-3'])
    })

    // Edge case: RPC retorna null → deve retornar array vazio
    it('retorna array vazio quando RPC retorna null', async () => {
        mockRpc.mockResolvedValueOnce({ data: null, error: null })

        const result = await getUnreadConversationIds()

        expect(result.data).toEqual([])
    })
})
