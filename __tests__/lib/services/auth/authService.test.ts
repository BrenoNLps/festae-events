import {
    signInWithGoogle,
    signOut,
    getSession,
    getUser,
    onAuthStateChange,
} from '@/app/lib/services/auth/authService'

jest.mock('@/app/lib/supabase/singleton', () => {
    const auth = {
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(),
    }
    const client = { auth }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client }
})

const { __mockClient: mockClient } = jest.requireMock('@/app/lib/supabase/singleton')
const mockAuth = mockClient.auth as Record<string, jest.Mock>

beforeEach(() => {
    jest.resetAllMocks()
})

describe('signInWithGoogle', () => {
    // Happy path: deve chamar signInWithOAuth com o provider correto e redirectTo
    it('chama signInWithOAuth com provider google e redirectTo correto', async () => {
        const redirectTo = 'https://festae.com/auth/callback'
        mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null })

        await signInWithGoogle(redirectTo)

        expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo },
        })
    })

    // Happy path: repassa o retorno do Supabase ao chamador
    it('retorna o resultado do Supabase', async () => {
        const mockReturn = { data: { url: 'https://...' }, error: null }
        mockAuth.signInWithOAuth.mockResolvedValueOnce(mockReturn)

        const result = await signInWithGoogle('https://example.com')

        expect(result).toEqual(mockReturn)
    })
})

describe('signOut', () => {
    // Happy path: deve chamar signOut do Supabase
    it('chama supabase.auth.signOut', async () => {
        mockAuth.signOut.mockResolvedValueOnce({ error: null })

        await signOut()

        expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
    })
})

describe('getSession', () => {
    // Happy path: retorna a sessão ativa do usuário
    it('retorna sessão quando usuário está autenticado', async () => {
        const mockSession = { user: { id: 'user-1', email: 'test@test.com' } }
        mockAuth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null })

        const result = await getSession()

        expect(result.data.session).toEqual(mockSession)
        expect(mockAuth.getSession).toHaveBeenCalledTimes(1)
    })

    // Edge case: retorna null quando não há sessão ativa
    it('retorna session null quando usuário não está autenticado', async () => {
        mockAuth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })

        const result = await getSession()

        expect(result.data.session).toBeNull()
    })
})

describe('getUser', () => {
    // Happy path: retorna o usuário autenticado
    it('retorna o usuário autenticado', async () => {
        const mockUser = { id: 'user-1', email: 'test@test.com' }
        mockAuth.getUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })

        const result = await getUser()

        expect(result.data.user).toEqual(mockUser)
    })
})

describe('onAuthStateChange', () => {
    // Happy path: registra o callback e retorna subscription
    it('registra o listener e retorna subscription para cancelamento', () => {
        const mockUnsubscribe = jest.fn()
        mockAuth.onAuthStateChange.mockReturnValueOnce({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        })
        const callback = jest.fn()

        const result = onAuthStateChange(callback)

        expect(mockAuth.onAuthStateChange).toHaveBeenCalledWith(callback)
        expect(result.data.subscription.unsubscribe).toBe(mockUnsubscribe)
    })
})
