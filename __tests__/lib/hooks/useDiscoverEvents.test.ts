import { renderHook, act, waitFor } from '@testing-library/react'
import { useDiscoverEvents } from '@/app/lib/hooks/useDiscoverEvents'
import { EventCategory } from '@/app/lib/types'

jest.mock('@/app/lib/services/database/eventService')
jest.mock('@/app/lib/utils/date')

import { getEvents } from '@/app/lib/services/database/eventService'
import { getTodayAsString } from '@/app/lib/utils/date'

const mockGetEvents = getEvents as jest.Mock
const mockGetToday = getTodayAsString as jest.Mock

const TODAY = '2025-06-15'

const evento = (overrides = {}) => ({
    id: 1,
    nome: 'Festival',
    vagas: 100,
    valor: 0,
    hora_inicio: '18:00',
    hora_fim: '23:00',
    endereco: { cep: '01310100', logradouro: 'Av. Paulista', numero: '1', bairro: 'BV', cidade: 'SP', estado: 'SP' },
    id_organizador: 'user-1',
    categoria: EventCategory.FESTA,
    data_inicio: '2025-07-01',
    data_fim: '2025-07-02',
    ...overrides,
})

beforeEach(() => {
    jest.clearAllMocks()
    mockGetToday.mockReturnValue(TODAY)
    mockGetEvents.mockResolvedValue({ data: [], error: null })
    localStorage.clear()
})

describe('useDiscoverEvents', () => {
    // Happy path: carrega eventos ao montar
    it('carrega eventos e define loading false após montagem', async () => {
        const eventos = [evento()]
        mockGetEvents.mockResolvedValueOnce({ data: eventos, error: null })

        const { result } = renderHook(() => useDiscoverEvents())

        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(mockGetEvents).toHaveBeenCalled()
    })

    // Happy path: classifica eventos por categoria de data
    it('classifica eventos corretamente em upcoming, ongoing, finished e latest', async () => {
        const futuro = evento({ id: 1, data_inicio: '2025-07-01', data_fim: '2025-07-02' })
        const emCurso = evento({ id: 2, data_inicio: '2025-06-10', data_fim: '2025-06-20' })
        const passado = evento({ id: 3, data_inicio: '2025-01-01', data_fim: '2025-01-02' })

        mockGetEvents.mockResolvedValueOnce({ data: [futuro, emCurso, passado], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.upcoming).toContainEqual(futuro)
        expect(result.current.ongoing).toContainEqual(emCurso)
        expect(result.current.finished).toContainEqual(passado)
    })

    // Happy path: upcoming ordenado por data_inicio ascendente
    it('ordena upcoming por data_inicio do mais próximo ao mais distante', async () => {
        const e1 = evento({ id: 1, data_inicio: '2025-09-01', data_fim: '2025-09-02' })
        const e2 = evento({ id: 2, data_inicio: '2025-07-01', data_fim: '2025-07-02' })
        const e3 = evento({ id: 3, data_inicio: '2025-08-01', data_fim: '2025-08-02' })

        mockGetEvents.mockResolvedValueOnce({ data: [e1, e2, e3], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.upcoming[0].id).toBe(2) // julho
        expect(result.current.upcoming[1].id).toBe(3) // agosto
        expect(result.current.upcoming[2].id).toBe(1) // setembro
    })

    // Happy path: latest ordenado por id decrescente (mais recentes primeiro)
    it('ordena latest por id decrescente', async () => {
        const eventos = [
            evento({ id: 1, data_inicio: '2025-07-01', data_fim: '2025-07-02' }),
            evento({ id: 5, data_inicio: '2025-08-01', data_fim: '2025-08-02' }),
            evento({ id: 3, data_inicio: '2025-09-01', data_fim: '2025-09-02' }),
        ]
        mockGetEvents.mockResolvedValueOnce({ data: eventos, error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.latest[0].id).toBe(5)
        expect(result.current.latest[1].id).toBe(3)
        expect(result.current.latest[2].id).toBe(1)
    })

    // Happy path: setEstado aplica filtro e limpa cidade
    it('setEstado atualiza estado, limpa cidade e recarrega eventos', async () => {
        mockGetEvents.mockResolvedValue({ data: [], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        // Define cidade primeiro
        act(() => { result.current.setCidade('São Paulo') })
        await waitFor(() => expect(result.current.loading).toBe(false))

        // Muda estado → deve limpar cidade
        act(() => { result.current.setEstado('RJ') })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.estado).toBe('RJ')
        expect(result.current.cidade).toBe('')
    })

    // Happy path: clearFilter reseta todos os filtros
    it('clearFilter reseta estado, cidade e categoria', async () => {
        mockGetEvents.mockResolvedValue({ data: [], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        act(() => { result.current.setEstado('SP') })
        await waitFor(() => expect(result.current.loading).toBe(false))

        act(() => { result.current.clearFilter() })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.estado).toBe('')
        expect(result.current.cidade).toBe('')
        expect(result.current.categoria).toBe('')
    })

    // Happy path: aplica filtros persistidos no localStorage ao montar
    it('restaura filtros do localStorage ao montar', async () => {
        localStorage.setItem('filtro_estado', 'SP')
        localStorage.setItem('filtro_cidade', 'São Paulo')
        mockGetEvents.mockResolvedValue({ data: [], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.estado).toBe('SP')
        expect(result.current.cidade).toBe('São Paulo')
        expect(mockGetEvents).toHaveBeenCalledWith(
            expect.objectContaining({ estado: 'SP', cidade: 'São Paulo' })
        )
    })

    // Edge case: erro na consulta → loading fica false sem quebrar
    it('define loading false mesmo quando getEvents falha', async () => {
        mockGetEvents.mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.latest).toEqual([])
    })

    // Edge case: getEvents chamado sem filtros quando todos estão vazios
    it('chama getEvents sem filtros quando nenhum filtro está ativo', async () => {
        mockGetEvents.mockResolvedValue({ data: [], error: null })

        const { result } = renderHook(() => useDiscoverEvents())
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(mockGetEvents).toHaveBeenCalledWith(undefined)
    })
})
