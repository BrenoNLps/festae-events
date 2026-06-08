// ─── Mock global Response (Web API ausente no ambiente Jest/Node) ─────────────

class MockResponse {
    public status: number
    private _body: unknown

    constructor(body: string, init?: { status?: number }) {
        this.status = init?.status ?? 200
        this._body = JSON.parse(body)
    }

    static json(data: unknown, init?: { status?: number }) {
        return new MockResponse(JSON.stringify(data), init)
    }

    async json() {
        return this._body
    }
}

;(global as any).Response = MockResponse

// ─── Mocks de dependências ────────────────────────────────────────────────────

jest.mock('@/app/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

jest.mock('@/app/lib/services/database/eventService', () => ({
    getEventById: jest.fn(),
}))

const mockPreferenceCreate = jest.fn()
jest.mock('mercadopago', () => ({
    MercadoPagoConfig: jest.fn(),
    Preference: jest.fn().mockImplementation(() => ({
        create: mockPreferenceCreate,
    })),
}))

import { createClient } from '@/app/lib/supabase/server'
import { getEventById } from '@/app/lib/services/database/eventService'
import { POST } from '@/app/api/pagamento/criar-preferencia/route'

const mockCreateClient = createClient as jest.Mock
const mockGetEventById = getEventById as jest.Mock

// ─── Helpers ──────────────────────────────────────────────────────────────────

// A rota só usa req.json() e req.headers.get('host') — mock direto evita
// depender do global Request que não existe no ambiente Jest.
function makeRequest(body: unknown, headers: Record<string, string> = {}) {
    const allHeaders: Record<string, string> = { host: 'localhost:3000', ...headers }
    return {
        json: jest.fn().mockResolvedValue(body),
        headers: { get: (key: string) => allHeaders[key] ?? null },
    } as any
}

function makeBrokenRequest() {
    return {
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
        headers: { get: (_key: string) => 'localhost:3000' },
    } as any
}

function mockAutenticado(userId = 'user-abc') {
    mockCreateClient.mockResolvedValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    })
}

function mockNaoAutenticado() {
    mockCreateClient.mockResolvedValue({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    })
}

const eventoValido = () => ({
    id: 1,
    nome: 'Show de Rock',
    valor: 150,
    vagas: 100,
})

beforeEach(() => {
    jest.clearAllMocks()
    mockPreferenceCreate.mockResolvedValue({ init_point: 'https://mp.com/checkout/1' })
})

// ─── Autenticação ─────────────────────────────────────────────────────────────

describe('autenticação', () => {
    it('retorna 401 quando usuário não está autenticado', async () => {
        mockNaoAutenticado()

        const res = await POST(makeRequest({ eventoId: 1 }))

        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body.error).toBe('Não autorizado')
    })

    it('não chama getEventById quando não autenticado', async () => {
        mockNaoAutenticado()

        await POST(makeRequest({ eventoId: 1 }))

        expect(mockGetEventById).not.toHaveBeenCalled()
    })
})

// ─── Validação de eventoId ────────────────────────────────────────────────────

describe('validação de eventoId — inputs inválidos', () => {
    beforeEach(() => mockAutenticado())

    // eventoId ausente → Number(undefined) = NaN → getEventById(NaN)
    it('eventoId ausente: passa NaN para getEventById (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({}))

        expect(mockGetEventById).toHaveBeenCalledWith(NaN)
        expect(res.status).toBe(404)
    })

    // eventoId null → Number(null) = 0 → busca evento com id 0
    it('eventoId null: converte para 0 e busca evento com id 0 (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: null }))

        expect(mockGetEventById).toHaveBeenCalledWith(0)
        expect(res.status).toBe(404)
    })

    // eventoId negativo → aceito sem rejeição
    it('eventoId negativo: é passado para o banco sem rejeição (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: -99 }))

        expect(mockGetEventById).toHaveBeenCalledWith(-99)
        expect(res.status).toBe(404)
    })

    // eventoId zero → aceito sem rejeição
    it('eventoId zero: é passado para o banco sem rejeição (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: 0 }))

        expect(mockGetEventById).toHaveBeenCalledWith(0)
        expect(res.status).toBe(404)
    })

    // eventoId float → não é truncado para inteiro
    it('eventoId float 1.9: não é truncado para inteiro antes de buscar', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        await POST(makeRequest({ eventoId: 1.9 }))

        expect(mockGetEventById).toHaveBeenCalledWith(1.9)
    })

    // eventoId como objeto → Number({}) = NaN
    it('eventoId como objeto: converte para NaN sem lançar erro', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: {} }))

        expect(mockGetEventById).toHaveBeenCalledWith(NaN)
        expect(res.status).toBe(404)
    })

    // eventoId como array → Number([5]) = 5 (JS converte silenciosamente)
    it('eventoId como array [5]: JavaScript converte para 5 silenciosamente (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: { ...eventoValido(), id: 5 } })

        const res = await POST(makeRequest({ eventoId: [5] }))

        expect(mockGetEventById).toHaveBeenCalledWith(5)
        expect(res.status).toBe(200)
    })

    // número muito grande
    it('eventoId muito grande (MAX_SAFE_INTEGER+1): é passado sem rejeição', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: Number.MAX_SAFE_INTEGER + 1 }))

        expect(mockGetEventById).toHaveBeenCalled()
        expect(res.status).toBe(404)
    })
})

// ─── Injeção via eventoId ─────────────────────────────────────────────────────

describe('tentativas de injeção via eventoId', () => {
    beforeEach(() => mockAutenticado())

    // SQL injection via string → Number() converte para NaN, não chega como string ao banco
    it('SQL injection "1; DROP TABLE evento": Number() vira NaN (não chega ao banco como string)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        await POST(makeRequest({ eventoId: '1; DROP TABLE evento' }))

        expect(mockGetEventById).toHaveBeenCalledWith(NaN)
    })

    // String numérica → aceita sem validar o tipo
    it('string numérica "1": é convertida e aceita sem validar o tipo do campo', async () => {
        mockGetEventById.mockResolvedValue({ data: eventoValido() })

        const res = await POST(makeRequest({ eventoId: '1' }))

        expect(mockGetEventById).toHaveBeenCalledWith(1)
        expect(res.status).toBe(200)
    })

    // Prototype pollution — JSON.parse em engines modernas não contamina Object.prototype
    it('prototype pollution: JSON.parse não contamina Object.prototype em V8', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const req = {
            json: jest.fn().mockResolvedValue(
                JSON.parse('{"eventoId":1,"__proto__":{"admin":true}}')
            ),
            headers: { get: (_key: string) => 'localhost:3000' },
        } as any

        await POST(req)

        expect((Object.prototype as any).admin).toBeUndefined()
    })

    // XSS via script tag → Number() descarta
    it('XSS via script tag: Number() descarta a string maliciosa', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        await POST(makeRequest({ eventoId: '<script>alert(1)</script>' }))

        expect(mockGetEventById).toHaveBeenCalledWith(NaN)
    })

    // String com espaços → Number("  1  ") = 1 — aceita sem validar tipo
    it('string "  1  " com espaços: Number() aceita e converte para 1 sem validar tipo', async () => {
        mockGetEventById.mockResolvedValue({ data: eventoValido() })

        const res = await POST(makeRequest({ eventoId: '  1  ' }))

        expect(mockGetEventById).toHaveBeenCalledWith(1)
        expect(res.status).toBe(200)
    })

    // Infinity → aceito sem rejeição
    it('eventoId Infinity: é passado para o banco sem rejeição (ausência de validação)', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        await POST(makeRequest({ eventoId: Infinity }))

        expect(mockGetEventById).toHaveBeenCalledWith(Infinity)
    })
})

// ─── Body malformado ──────────────────────────────────────────────────────────
// req.json() é chamado FORA do try-catch da rota → erro propaga, não retorna 500

describe('body malformado ou ausente', () => {
    beforeEach(() => mockAutenticado())

    it('JSON inválido: a exceção de req.json() não é capturada pela rota (bug: deveria retornar 400)', async () => {
        await expect(POST(makeBrokenRequest())).rejects.toThrow(SyntaxError)
    })
})

// ─── Header host ──────────────────────────────────────────────────────────────

describe('manipulação do header host', () => {
    beforeEach(() => {
        mockAutenticado()
        mockGetEventById.mockResolvedValue({ data: eventoValido() })
    })

    it('host localhost: usa protocolo http e não inclui auto_return', async () => {
        const res = await POST(makeRequest({ eventoId: 1 }, { host: 'localhost:3000' }))

        expect(res.status).toBe(200)
        const callArg = mockPreferenceCreate.mock.calls[0][0].body
        expect(callArg.back_urls.success).toMatch(/^http:\/\/localhost/)
        expect(callArg.auto_return).toBeUndefined()
    })

    it('host de produção: usa protocolo https e inclui auto_return approved', async () => {
        const res = await POST(makeRequest({ eventoId: 1 }, { host: 'meusite.com.br' }))

        expect(res.status).toBe(200)
        const callArg = mockPreferenceCreate.mock.calls[0][0].body
        expect(callArg.back_urls.success).toMatch(/^https:\/\/meusite\.com\.br/)
        expect(callArg.auto_return).toBe('approved')
    })

    // host null → host.startsWith() lança TypeError FORA do try-catch → propaga (bug)
    it('header host ausente: TypeError não é capturado pela rota (bug: deveria retornar 400)', async () => {
        const req = {
            json: jest.fn().mockResolvedValue({ eventoId: 1 }),
            headers: { get: (_key: string) => null },
        } as any

        await expect(POST(req)).rejects.toThrow(TypeError)
    })
})

// ─── Integração com MercadoPago ───────────────────────────────────────────────

describe('integração com MercadoPago', () => {
    beforeEach(() => {
        mockAutenticado()
        mockGetEventById.mockResolvedValue({ data: eventoValido() })
    })

    it('happy path: retorna init_point com status 200', async () => {
        const res = await POST(makeRequest({ eventoId: 1 }))

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.init_point).toBe('https://mp.com/checkout/1')
    })

    it('envia os dados corretos do evento para o MercadoPago', async () => {
        await POST(makeRequest({ eventoId: 1 }))

        const callArg = mockPreferenceCreate.mock.calls[0][0].body
        expect(callArg.items[0]).toMatchObject({
            id: '1',
            title: 'Show de Rock',
            quantity: 1,
            unit_price: 150,
            currency_id: 'BRL',
        })
        expect(callArg.external_reference).toBe('1')
    })

    it('MercadoPago lança erro: retorna 500 com a mensagem de erro', async () => {
        mockPreferenceCreate.mockRejectedValue(new Error('Token inválido'))

        const res = await POST(makeRequest({ eventoId: 1 }))

        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error).toBe('Token inválido')
    })

    it('evento não encontrado: retorna 404', async () => {
        mockGetEventById.mockResolvedValue({ data: null })

        const res = await POST(makeRequest({ eventoId: 999 }))

        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body.error).toBe('Evento não encontrado')
    })
})
