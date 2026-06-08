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
// Comportamento esperado: eventoId inválido deve retornar 400.
// Esses testes FALHAM enquanto a rota não tiver validação.

describe('validação de eventoId — inputs inválidos devem retornar 400', () => {
    beforeEach(() => mockAutenticado())

    it('eventoId ausente deve retornar 400', async () => {
        const res = await POST(makeRequest({}))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId null deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: null }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId negativo deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: -99 }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId zero deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: 0 }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId float deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: 1.9 }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId como objeto deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: {} }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId como array deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: [5] }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId maior que MAX_SAFE_INTEGER deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: Number.MAX_SAFE_INTEGER + 1 }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })
})

// ─── Injeção via eventoId ─────────────────────────────────────────────────────
// Comportamento esperado: qualquer input não-numérico deve retornar 400.
// Esses testes FALHAM enquanto a rota não tiver validação.

describe('tentativas de injeção via eventoId — devem retornar 400', () => {
    beforeEach(() => mockAutenticado())

    it('SQL injection "1; DROP TABLE evento" deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: '1; DROP TABLE evento' }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('string numérica "1" deve retornar 400 (tipo errado)', async () => {
        const res = await POST(makeRequest({ eventoId: '1' }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('prototype pollution: não contamina Object.prototype', async () => {
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

    it('XSS via script tag deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: '<script>alert(1)</script>' }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('string com espaços "  1  " deve retornar 400 (tipo errado)', async () => {
        const res = await POST(makeRequest({ eventoId: '  1  ' }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })

    it('eventoId Infinity deve retornar 400', async () => {
        const res = await POST(makeRequest({ eventoId: Infinity }))
        expect(res.status).toBe(400)
        expect(mockGetEventById).not.toHaveBeenCalled()
    })
})

// ─── Body malformado ──────────────────────────────────────────────────────────
// Comportamento esperado: retornar 400, não explodir com erro não tratado.
// Esse teste FALHA enquanto req.json() estiver fora do try-catch.

describe('body malformado', () => {
    beforeEach(() => mockAutenticado())

    it('JSON inválido deve retornar 400, não lançar exceção não tratada', async () => {
        const res = await POST(makeBrokenRequest())
        expect(res.status).toBe(400)
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

    // Comportamento esperado: retornar 400/500 graciosamente, não explodir.
    // Esse teste FALHA enquanto host.startsWith() estiver fora do try-catch.
    it('header host ausente deve retornar erro gracioso, não TypeError não tratado', async () => {
        const req = {
            json: jest.fn().mockResolvedValue({ eventoId: 1 }),
            headers: { get: (_key: string) => null },
        } as any

        const res = await POST(req)
        expect([400, 500]).toContain(res.status)
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
