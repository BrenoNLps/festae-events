import { formatPrice, formatLocation } from '@/app/lib/utils/event'
import { Adress } from '@/app/lib/types'

const endereco = (overrides?: Partial<Adress>): Adress => ({
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    ...overrides,
})

describe('formatPrice', () => {
    // Happy path: valor inteiro formatado como moeda brasileira
    it('formata valor inteiro corretamente', () => {
        expect(formatPrice(50)).toBe('R$ 50,00')
    })

    // Happy path: valor com centavos formatado corretamente
    it('formata valor com centavos corretamente', () => {
        expect(formatPrice(29.9)).toBe('R$ 29,90')
    })

    // Happy path: valor alto formatado corretamente
    it('formata valor alto corretamente', () => {
        expect(formatPrice(1500)).toBe('R$ 1500,00')
    })

    // Edge case: valor zero deve retornar "Gratuito" em vez de formatar
    it('retorna "Gratuito" quando valor é 0', () => {
        expect(formatPrice(0)).toBe('Gratuito')
    })
})

describe('formatLocation', () => {
    // Happy path: cidade e estado presentes retornam "Cidade, Estado"
    it('retorna "Cidade, Estado" quando ambos estão presentes', () => {
        expect(formatLocation(endereco())).toBe('São Paulo, SP')
    })

    // Edge case: apenas cidade presente
    it('retorna apenas a cidade quando estado está ausente', () => {
        expect(formatLocation(endereco({ estado: '' }))).toBe('São Paulo')
    })

    // Edge case: apenas estado presente
    it('retorna apenas o estado quando cidade está ausente', () => {
        expect(formatLocation(endereco({ cidade: '' }))).toBe('SP')
    })

    // Edge case: nenhum dos dois presentes deve retornar string vazia
    it('retorna string vazia quando ambos estão ausentes', () => {
        expect(formatLocation(endereco({ cidade: '', estado: '' }))).toBe('')
    })
})