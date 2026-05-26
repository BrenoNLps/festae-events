import { renderHook, waitFor } from '@testing-library/react'
import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'

jest.mock('@/app/lib/services/auth/authService')

import { getSession, onAuthStateChange } from '@/app/lib/services/auth/authService'

const mockGetSession = getSession as jest.Mock
const mockOnAuthStateChange = onAuthStateChange as jest.Mock
const mockUnsubscribe = jest.fn()

beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
})

describe('useCurrentUser', () => {
    // Happy path: inicia com loading true e user null antes da sessão ser resolvida
    it('inicia com loading true e user null', () => {
        // getSession nunca resolve (promise pendente)
        mockGetSession.mockReturnValue(new Promise(() => {}))

        const { result } = renderHook(() => useCurrentUser())

        expect(result.current.loading).toBe(true)
        expect(result.current.user).toBeNull()
    })

    // Happy path: define user quando sessão ativa existe
    it('define user e loading false quando sessão está ativa', async () => {
        const mockUser = { id: 'user-1', email: 'test@festae.com' }
        mockGetSession.mockResolvedValueOnce({
            data: { session: { user: mockUser } },
        })

        const { result } = renderHook(() => useCurrentUser())

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.user).toEqual(mockUser)
    })

    // Edge case: user null quando não há sessão ativa
    it('define user como null e loading false quando sem sessão', async () => {
        mockGetSession.mockResolvedValueOnce({
            data: { session: null },
        })

        const { result } = renderHook(() => useCurrentUser())

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.user).toBeNull()
    })

    // Happy path: registra listener de auth state change ao montar
    it('registra listener de onAuthStateChange ao montar', async () => {
        mockGetSession.mockResolvedValueOnce({ data: { session: null } })

        renderHook(() => useCurrentUser())

        await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled())
    })

    // Happy path: cancela subscription ao desmontar
    it('chama unsubscribe ao desmontar o componente', async () => {
        mockGetSession.mockResolvedValueOnce({ data: { session: null } })

        const { unmount } = renderHook(() => useCurrentUser())
        await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled())

        unmount()

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
})
