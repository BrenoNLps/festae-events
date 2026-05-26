import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfile } from '@/app/lib/hooks/useProfile'
import { AccountType } from '@/app/lib/types'

jest.mock('@/app/lib/hooks/useCurrentUser')
jest.mock('@/app/lib/services/database/userService')

import { useCurrentUser } from '@/app/lib/hooks/useCurrentUser'
import { getUserById } from '@/app/lib/services/database/userService'

const mockUseCurrentUser = useCurrentUser as jest.Mock
const mockGetUserById = getUserById as jest.Mock

const authUser = { id: 'user-1', email: 'test@festae.com' }
const dbUser = { id: 'user-1', username: 'joao', tipo_conta: AccountType.USUARIO }

beforeEach(() => {
    jest.clearAllMocks()
})

describe('useProfile', () => {
    // Happy path: carrega dbUser quando autenticado
    it('carrega dbUser após autenticação e define loading false', async () => {
        mockUseCurrentUser.mockReturnValue({ user: authUser, loading: false })
        mockGetUserById.mockResolvedValueOnce({ data: dbUser, error: null })

        const { result } = renderHook(() => useProfile())

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.user).toEqual(authUser)
        expect(result.current.dbUser).toEqual(dbUser)
        expect(mockGetUserById).toHaveBeenCalledWith('user-1')
    })

    // Edge case: sem usuário autenticado → dbUser null e loading false
    it('define dbUser null e loading false quando não há sessão', async () => {
        mockUseCurrentUser.mockReturnValue({ user: null, loading: false })

        const { result } = renderHook(() => useProfile())

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.dbUser).toBeNull()
        expect(mockGetUserById).not.toHaveBeenCalled()
    })

    // Edge case: aguarda authLoading antes de buscar usuário
    it('aguarda authLoading antes de buscar o usuário no banco', async () => {
        // Primeiro render: ainda carregando auth
        mockUseCurrentUser.mockReturnValue({ user: null, loading: true })

        const { result, rerender } = renderHook(() => useProfile())

        expect(mockGetUserById).not.toHaveBeenCalled()
        expect(result.current.loading).toBe(true)

        // Segundo render: auth resolvido
        mockUseCurrentUser.mockReturnValue({ user: authUser, loading: false })
        mockGetUserById.mockResolvedValueOnce({ data: dbUser, error: null })

        rerender()
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(mockGetUserById).toHaveBeenCalledWith('user-1')
        expect(result.current.dbUser).toEqual(dbUser)
    })

    // Happy path: refresh recarrega dados do usuário
    it('refresh rebusca dbUser do banco', async () => {
        mockUseCurrentUser.mockReturnValue({ user: authUser, loading: false })
        const dbUserAtualizado = { ...dbUser, username: 'joaoatualizado' }
        mockGetUserById
            .mockResolvedValueOnce({ data: dbUser, error: null })
            .mockResolvedValueOnce({ data: dbUserAtualizado, error: null })

        const { result } = renderHook(() => useProfile())

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.dbUser?.username).toBe('joao')

        await act(async () => { await result.current.refresh() })

        expect(result.current.dbUser?.username).toBe('joaoatualizado')
        expect(mockGetUserById).toHaveBeenCalledTimes(2)
    })

    // Edge case: refresh não faz nada quando não há user
    it('refresh retorna Promise resolvida sem chamar serviço quando user é null', async () => {
        mockUseCurrentUser.mockReturnValue({ user: null, loading: false })

        const { result } = renderHook(() => useProfile())
        await waitFor(() => expect(result.current.loading).toBe(false))

        await act(async () => { await result.current.refresh() })

        expect(mockGetUserById).not.toHaveBeenCalled()
    })
})
