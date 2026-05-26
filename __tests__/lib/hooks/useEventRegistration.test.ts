import { renderHook, act, waitFor } from '@testing-library/react'
import { useEventRegistration } from '@/app/lib/hooks/useEventRegistration'

jest.mock('@/app/lib/services/database/registrationService')

import {
    checkRegistration,
    createRegistration,
    deleteRegistration,
    getRegistrationCount,
} from '@/app/lib/services/database/registrationService'

const mockCheckRegistration = checkRegistration as jest.Mock
const mockCreateRegistration = createRegistration as jest.Mock
const mockDeleteRegistration = deleteRegistration as jest.Mock
const mockGetRegistrationCount = getRegistrationCount as jest.Mock

beforeEach(() => {
    jest.clearAllMocks()
    mockGetRegistrationCount.mockResolvedValue(0)
    mockCheckRegistration.mockResolvedValue({ data: null, error: null })
})

describe('useEventRegistration', () => {
    // Happy path: carrega estado inicial de inscrição e contagem
    it('carrega contagem e status de inscrição ao montar', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(5)
        mockCheckRegistration.mockResolvedValueOnce({ data: { id: 1 }, error: null })

        const { result } = renderHook(() => useEventRegistration('user-1', 10))

        await waitFor(() => expect(result.current.checking).toBe(false))

        expect(result.current.registrationCount).toBe(5)
        expect(result.current.isRegistered).toBe(true)
    })

    // Edge case: userId null → não verifica inscrição individual
    it('não verifica inscrição individual quando userId é null', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(3)

        const { result } = renderHook(() => useEventRegistration(null, 10))

        await waitFor(() => expect(result.current.checking).toBe(false))

        expect(mockCheckRegistration).not.toHaveBeenCalled()
        expect(result.current.registrationCount).toBe(3)
        expect(result.current.isRegistered).toBe(false)
    })

    // Edge case: eventId null → não faz nenhuma consulta
    it('não faz consultas quando eventId é null', async () => {
        const { result } = renderHook(() => useEventRegistration('user-1', null))

        expect(mockGetRegistrationCount).not.toHaveBeenCalled()
        expect(result.current.checking).toBe(false)
    })

    // Happy path: isFull true quando registrationCount >= maxVagas
    it('isFull é true quando evento está lotado', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(100)

        const { result } = renderHook(() => useEventRegistration('user-1', 10, 100))

        await waitFor(() => expect(result.current.checking).toBe(false))

        expect(result.current.isFull).toBe(true)
    })

    // Happy path: isFull false quando ainda há vagas
    it('isFull é false quando ainda há vagas disponíveis', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(50)

        const { result } = renderHook(() => useEventRegistration('user-1', 10, 100))

        await waitFor(() => expect(result.current.checking).toBe(false))

        expect(result.current.isFull).toBe(false)
    })

    // Happy path: inscrição bem-sucedida atualiza estado
    it('register atualiza isRegistered e incrementa contagem', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(10)
        mockCheckRegistration.mockResolvedValueOnce({ data: null, error: null })
        mockCreateRegistration.mockResolvedValueOnce({ data: null, error: null })

        const { result } = renderHook(() => useEventRegistration('user-1', 42))

        await waitFor(() => expect(result.current.checking).toBe(false))
        expect(result.current.isRegistered).toBe(false)

        await act(async () => { await result.current.register() })

        expect(result.current.isRegistered).toBe(true)
        expect(result.current.registrationCount).toBe(11)
        expect(mockCreateRegistration).toHaveBeenCalledWith({ id_usuario: 'user-1', id_evento: 42 })
    })

    // Edge case: register não faz nada quando userId é null
    it('register não chama o serviço quando userId é null', async () => {
        const { result } = renderHook(() => useEventRegistration(null, 42))

        await act(async () => { await result.current.register() })

        expect(mockCreateRegistration).not.toHaveBeenCalled()
    })

    // Happy path: cancelamento de inscrição atualiza estado
    it('unregister atualiza isRegistered e decrementa contagem', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(10)
        mockCheckRegistration.mockResolvedValueOnce({ data: { id: 1 }, error: null })
        mockDeleteRegistration.mockResolvedValueOnce({ error: null })

        const { result } = renderHook(() => useEventRegistration('user-1', 42))

        await waitFor(() => expect(result.current.checking).toBe(false))
        expect(result.current.isRegistered).toBe(true)

        await act(async () => { await result.current.unregister() })

        expect(result.current.isRegistered).toBe(false)
        expect(result.current.registrationCount).toBe(9)
        expect(mockDeleteRegistration).toHaveBeenCalledWith('user-1', 42)
    })

    // Edge case: contagem não vai abaixo de 0 ao cancelar inscrição
    it('unregister não deixa registrationCount ir abaixo de 0', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(0)
        mockCheckRegistration.mockResolvedValueOnce({ data: { id: 1 }, error: null })
        mockDeleteRegistration.mockResolvedValueOnce({ error: null })

        const { result } = renderHook(() => useEventRegistration('user-1', 42))

        await waitFor(() => expect(result.current.checking).toBe(false))
        await act(async () => { await result.current.unregister() })

        expect(result.current.registrationCount).toBe(0)
    })

    // Edge case: erro no register não altera o estado
    it('register não altera isRegistered quando o serviço retorna erro', async () => {
        mockGetRegistrationCount.mockResolvedValueOnce(5)
        mockCheckRegistration.mockResolvedValueOnce({ data: null, error: null })
        mockCreateRegistration.mockResolvedValueOnce({ data: null, error: new Error('Conflict') })

        const { result } = renderHook(() => useEventRegistration('user-1', 42))

        await waitFor(() => expect(result.current.checking).toBe(false))
        await act(async () => { await result.current.register() })

        expect(result.current.isRegistered).toBe(false)
        expect(result.current.registrationCount).toBe(5)
    })
})
