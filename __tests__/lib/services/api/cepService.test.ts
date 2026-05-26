import { getCepData } from '@/app/lib/services/api/cepService'

const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
    jest.clearAllMocks()
})

describe('getCepData', () => {
    // Happy path: CEP válido retorna dados completos da API
    it('retorna dados de endereço para CEP válido', async () => {
        const apiResponse = {
            cep: '01310-100',
            logradouro: 'Av. Paulista',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
        }
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(apiResponse),
        } as unknown as Response)

        const result = await getCepData('01310100')

        expect(result).toEqual(apiResponse)
        expect(mockFetch).toHaveBeenCalledWith(
            'https://viacep.com.br/ws/01310100/json/',
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        )
    })

    // Edge case: API retorna { erro: true } para CEP inexistente → deve retornar null
    it('retorna null quando a API indica CEP inválido', async () => {
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({ erro: true }),
        } as unknown as Response)

        const result = await getCepData('00000000')

        expect(result).toBeNull()
    })

    // Edge case: erro de rede → deve capturar e retornar null
    it('retorna null quando ocorre erro de rede', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const result = await getCepData('01310100')

        expect(result).toBeNull()
    })

    // Edge case: timeout (AbortError) → deve capturar e retornar null
    it('retorna null quando a requisição é abortada por timeout', async () => {
        const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' })
        mockFetch.mockRejectedValueOnce(abortError)

        const result = await getCepData('01310100')

        expect(result).toBeNull()
    })

    // Edge case: JSON inválido na resposta → deve capturar e retornar null
    it('retorna null quando a resposta não é JSON válido', async () => {
        mockFetch.mockResolvedValueOnce({
            json: jest.fn().mockRejectedValueOnce(new SyntaxError('Unexpected token')),
        } as unknown as Response)

        const result = await getCepData('01310100')

        expect(result).toBeNull()
    })
})
