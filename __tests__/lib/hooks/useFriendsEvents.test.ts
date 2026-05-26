import { renderHook, waitFor } from '@testing-library/react'
import { useFriendsEvents } from '@/app/lib/hooks/useFriendsEvents'
import { EventCategory } from '@/app/lib/types'

jest.mock('@/app/lib/services/database/eventService')

import { getEventsByFriends } from '@/app/lib/services/database/eventService'

const mockGetEventsByFriends = getEventsByFriends as jest.Mock

const evento = (overrides = {}) => ({
    id: 1,
    nome: 'Festival',
    vagas: 100,
    valor: 0,
    data_inicio: '2030-07-01',
    data_fim: '2030-07-02',
    hora_inicio: '18:00',
    hora_fim: '23:00',
    endereco: { cep: '01310100', logradouro: 'Av. Paulista', numero: '1000', bairro: 'BV', cidade: 'SP', estado: 'SP' },
    id_organizador: 'user-1',
    categoria: EventCategory.FESTA,
    ...overrides,
})

beforeEach(() => {
    jest.clearAllMocks()
})

describe('useFriendsEvents', () => {
    // Happy path: carrega eventos dos amigos ao montar
    it('carrega eventos dos amigos e define loading false', async () => {
        const eventos = [evento(), evento({ id: 2, nome: 'Show de Rock' })]
        mockGetEventsByFriends.mockResolvedValueOnce(eventos)

        const { result } = renderHook(() => useFriendsEvents('user-1'))

        expect(result.current.loading).toBe(true)

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.events).toEqual(eventos)
        expect(mockGetEventsByFriends).toHaveBeenCalledWith('user-1')
    })

    // Edge case: userId null → não faz consulta e retorna vazio imediatamente
    it('não faz consulta quando userId é null e retorna loading false', async () => {
        const { result } = renderHook(() => useFriendsEvents(null))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.events).toEqual([])
        expect(mockGetEventsByFriends).not.toHaveBeenCalled()
    })

    // Edge case: sem eventos de amigos → retorna array vazio
    it('retorna array vazio quando amigos não têm eventos', async () => {
        mockGetEventsByFriends.mockResolvedValueOnce([])

        const { result } = renderHook(() => useFriendsEvents('user-1'))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.events).toEqual([])
    })

    // Edge case: erro na consulta → define loading false sem quebrar
    it('define loading false mesmo quando a consulta falha', async () => {
        mockGetEventsByFriends.mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useFriendsEvents('user-1'))

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.events).toEqual([])
    })

    // Happy path: recarrega ao mudar userId
    it('recarrega eventos quando userId muda', async () => {
        mockGetEventsByFriends
            .mockResolvedValueOnce([evento({ id: 1 })])
            .mockResolvedValueOnce([evento({ id: 2 })])

        const { result, rerender } = renderHook(
            ({ id }) => useFriendsEvents(id),
            { initialProps: { id: 'user-1' as string | null } }
        )

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.events[0].id).toBe(1)

        rerender({ id: 'user-2' })
        await waitFor(() => {
            expect(result.current.loading).toBe(false)
            expect(result.current.events[0].id).toBe(2)
        })

        expect(mockGetEventsByFriends).toHaveBeenCalledTimes(2)
        expect(mockGetEventsByFriends).toHaveBeenNthCalledWith(1, 'user-1')
        expect(mockGetEventsByFriends).toHaveBeenNthCalledWith(2, 'user-2')
    })
})
