import { getCidadesByEstado } from '@/app/lib/services/api/ibgeService'

const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
    jest.clearAllMocks()
})

describe('getCidadesByEstado', () => {
    // Happy path: retorna lista de cidades ordenada alfabeticamente
    it('retorna cidades ordenadas alfabeticamente para estado válido', async () => {
        const apiResponse = [
            { id: 3550308, nome: 'São Paulo' },
            { id: 3509502, nome: 'Campinas' },
            { id: 3548708, nome: 'Santos' },
        ]
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(apiResponse),
        } as unknown as Response)

        const result = await getCidadesByEstado('SP')

        expect(result).toEqual(['Campinas', 'Santos', 'São Paulo'])
        expect(mockFetch).toHaveBeenCalledWith(
            'https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios',
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
    })

    // Happy path: retorna lista com um único município corretamente
    it('retorna array com uma cidade quando o estado tem apenas um município na resposta', async () => {
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce([{ id: 1, nome: 'Brasília' }]),
        } as unknown as Response)

        const result = await getCidadesByEstado('DF')

        expect(result).toEqual(['Brasília'])
    })

    // Edge case: erro de rede → deve retornar array vazio
    it('retorna array vazio quando ocorre erro de rede', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const result = await getCidadesByEstado('SP')

        expect(result).toEqual([])
    })

    // Edge case: timeout (AbortError) → deve retornar array vazio
    it('retorna array vazio quando a requisição é abortada por timeout', async () => {
        const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' })
        mockFetch.mockRejectedValueOnce(abortError)

        const result = await getCidadesByEstado('SP')

        expect(result).toEqual([])
    })

    // Edge case: API retorna array vazio → deve retornar array vazio
    it('retorna array vazio quando a API não retorna municípios', async () => {
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce([]),
        } as unknown as Response)

        const result = await getCidadesByEstado('XX')

        expect(result).toEqual([])
    })
})
