import { renderHook, act, waitFor } from '@testing-library/react'
import { useSearch } from '@/app/lib/hooks/useSearch'

beforeEach(() => {
    jest.useFakeTimers()
})

afterEach(() => {
    jest.useRealTimers()
})

describe('useSearch', () => {
    // Happy path: estado inicial correto
    it('inicia com query vazia, resultados vazios e não carregando', () => {
        const searchFn = jest.fn().mockResolvedValue([])
        const { result } = renderHook(() => useSearch(searchFn))

        expect(result.current.query).toBe('')
        expect(result.current.results).toEqual([])
        expect(result.current.loading).toBe(false)
        expect(searchFn).not.toHaveBeenCalled()
    })

    // Happy path: define loading ao digitar e executa busca após debounce
    it('ativa loading ao digitar e executa busca após o debounce', async () => {
        const mockResults = [{ id: 1, nome: 'Festival Rock' }]
        const searchFn = jest.fn().mockResolvedValue(mockResults)

        const { result } = renderHook(() => useSearch(searchFn, 300))

        act(() => { result.current.setQuery('rock') })

        expect(result.current.loading).toBe(true)
        expect(searchFn).not.toHaveBeenCalled()

        await act(async () => { jest.advanceTimersByTime(300) })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(searchFn).toHaveBeenCalledWith('rock')
        expect(result.current.results).toEqual(mockResults)
    })

    // Edge case: query com apenas espaços não dispara busca
    it('não dispara busca quando query é só espaços', async () => {
        const searchFn = jest.fn().mockResolvedValue([])
        const { result } = renderHook(() => useSearch(searchFn))

        act(() => { result.current.setQuery('   ') })

        await act(async () => { jest.advanceTimersByTime(300) })

        expect(searchFn).not.toHaveBeenCalled()
        expect(result.current.loading).toBe(false)
        expect(result.current.results).toEqual([])
    })

    // Edge case: limpar query reseta resultados e loading
    it('limpa resultados e loading quando query é esvaziada', async () => {
        const searchFn = jest.fn().mockResolvedValue([{ id: 1 }])
        const { result } = renderHook(() => useSearch(searchFn))

        // Digita e aguarda resultado
        act(() => { result.current.setQuery('test') })
        await act(async () => { jest.advanceTimersByTime(300) })
        await waitFor(() => expect(result.current.results).toHaveLength(1))

        // Limpa a query
        act(() => { result.current.setQuery('') })

        expect(result.current.results).toEqual([])
        expect(result.current.loading).toBe(false)
    })

    // Happy path: debounce cancela chamadas anteriores ao digitar rapidamente
    it('executa apenas uma busca ao digitar rapidamente (debounce)', async () => {
        const searchFn = jest.fn().mockResolvedValue([])
        const { result } = renderHook(() => useSearch(searchFn, 300))

        act(() => { result.current.setQuery('r') })
        act(() => { result.current.setQuery('ro') })
        act(() => { result.current.setQuery('roc') })
        act(() => { result.current.setQuery('rock') })

        await act(async () => { jest.advanceTimersByTime(300) })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(searchFn).toHaveBeenCalledTimes(1)
        expect(searchFn).toHaveBeenCalledWith('rock')
    })

    // Happy path: a função de busca passada sempre usa a versão mais recente (ref)
    it('usa a versão mais recente de searchFn sem re-disparar o debounce', async () => {
        const searchFnV1 = jest.fn().mockResolvedValue([{ id: 1 }])
        const searchFnV2 = jest.fn().mockResolvedValue([{ id: 2 }])

        const { result, rerender } = renderHook(
            ({ fn }) => useSearch(fn, 300),
            { initialProps: { fn: searchFnV1 } }
        )

        act(() => { result.current.setQuery('test') })
        rerender({ fn: searchFnV2 })

        await act(async () => { jest.advanceTimersByTime(300) })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(searchFnV1).not.toHaveBeenCalled()
        expect(searchFnV2).toHaveBeenCalledWith('test')
    })

    // Edge case: debounce personalizado é respeitado
    it('respeita debounce de 500ms quando configurado', async () => {
        const searchFn = jest.fn().mockResolvedValue([])
        const { result } = renderHook(() => useSearch(searchFn, 500))

        act(() => { result.current.setQuery('abc') })

        await act(async () => { jest.advanceTimersByTime(499) })
        expect(searchFn).not.toHaveBeenCalled()

        await act(async () => { jest.advanceTimersByTime(1) })
        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(searchFn).toHaveBeenCalledTimes(1)
    })
})
