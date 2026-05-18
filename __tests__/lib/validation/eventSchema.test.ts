import { eventSchema } from '@/app/lib/validation/eventSchema'

const enderecoValido = {
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
}

const eventoValido = {
    nome: 'Festival de Verão',
    descricao: 'Um evento incrível',
    vagas: 100,
    valor: 50,
    data_inicio: '2024-12-01',
    data_fim: '2024-12-02',
    hora_inicio: '18:00',
    hora_fim: '23:00',
    endereco: enderecoValido,
}

function getIssue(result: ReturnType<typeof eventSchema.safeParse>, path: string) {
    if (result.success) return undefined
    return result.error.issues.find(i => i.path[0] === path)
}

describe('eventSchema', () => {
    // Happy path: evento com todos os campos válidos deve passar na validação
    it('valida um evento correto', () => {
        expect(eventSchema.safeParse(eventoValido).success).toBe(true)
    })

    // Happy path: descrição é opcional, evento sem ela deve ser aceito
    it('aceita evento sem descrição', () => {
        const { descricao, ...semDescricao } = eventoValido
        expect(eventSchema.safeParse(semDescricao).success).toBe(true)
    })

    // Happy path: valor 0 representa evento gratuito e deve ser aceito
    it('aceita evento gratuito (valor 0)', () => {
        expect(eventSchema.safeParse({ ...eventoValido, valor: 0 }).success).toBe(true)
    })

    // Happy path: data_fim igual a data_inicio representa evento de um dia e deve ser aceito
    it('aceita data_fim igual a data_inicio', () => {
        const result = eventSchema.safeParse({
            ...eventoValido,
            data_inicio: '2024-12-10',
            data_fim: '2024-12-10',
        })
        expect(result.success).toBe(true)
    })

    // Edge case: nome com menos de 3 caracteres deve ser rejeitado
    it('rejeita nome com menos de 3 caracteres', () => {
        const result = eventSchema.safeParse({ ...eventoValido, nome: 'AB' })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'nome')
        expect(issue?.path).toEqual(['nome'])
        expect(issue?.message).toBe('Mínimo 3 caracteres')
    })

    // Edge case: nome acima do limite de 100 caracteres deve ser rejeitado
    it('rejeita nome com mais de 100 caracteres', () => {
        const result = eventSchema.safeParse({ ...eventoValido, nome: 'A'.repeat(101) })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'nome')
        expect(issue?.path).toEqual(['nome'])
        expect(issue?.message).toBe('Máximo 100 caracteres')
    })

    // Edge case: vagas negativas não fazem sentido e devem ser rejeitadas
    it('rejeita vagas negativas', () => {
        const result = eventSchema.safeParse({ ...eventoValido, vagas: -1 })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'vagas')
        expect(issue?.path).toEqual(['vagas'])
        expect(issue?.message).toBe('Mínimo 1 vaga')
    })

    // Edge case: vagas devem ser inteiras, valor decimal deve ser rejeitado
    it('rejeita vagas com valor decimal', () => {
        const result = eventSchema.safeParse({ ...eventoValido, vagas: 1.5 })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'vagas')
        expect(issue?.path).toEqual(['vagas'])
        expect(issue?.message).toBe('Deve ser número inteiro')
    })

    // Edge case: valor negativo é inválido e deve ser rejeitado
    it('rejeita valor negativo', () => {
        const result = eventSchema.safeParse({ ...eventoValido, valor: -1 })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'valor')
        expect(issue?.path).toEqual(['valor'])
        expect(issue?.message).toBe('Valor não pode ser negativo')
    })

    // Edge case: valor acima do limite máximo permitido deve ser rejeitado
    it('rejeita valor acima do máximo', () => {
        const result = eventSchema.safeParse({ ...eventoValido, valor: 1000000 })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'valor')
        expect(issue?.path).toEqual(['valor'])
        expect(issue?.message).toBe('Valor máximo R$ 999.999,99')
    })

    // Edge case: data_fim anterior a data_inicio é incoerente e deve ser rejeitada
    it('rejeita data_fim anterior a data_inicio', () => {
        const result = eventSchema.safeParse({
            ...eventoValido,
            data_inicio: '2024-12-10',
            data_fim: '2024-12-05',
        })
        expect(result.success).toBe(false)
        const issue = getIssue(result, 'data_fim')
        expect(issue?.path).toEqual(['data_fim'])
        expect(issue?.message).toBe('Data de fim deve ser após a data de início')
    })

    // Edge case: CEP com tamanho diferente de 8 dígitos deve ser rejeitado
    it('rejeita CEP com tamanho diferente de 8', () => {
        const result = eventSchema.safeParse({
            ...eventoValido,
            endereco: { ...enderecoValido, cep: '0131010' },
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues.find(i => JSON.stringify(i.path) === JSON.stringify(['endereco', 'cep']))
            expect(issue?.path).toEqual(['endereco', 'cep'])
            expect(issue?.message).toBe('CEP inválido')
        }
    })

    // Edge case: logradouro é obrigatório, string vazia deve ser rejeitada
    it('rejeita endereço sem logradouro', () => {
        const result = eventSchema.safeParse({
            ...eventoValido,
            endereco: { ...enderecoValido, logradouro: '' },
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues.find(i => JSON.stringify(i.path) === JSON.stringify(['endereco', 'logradouro']))
            expect(issue?.path).toEqual(['endereco', 'logradouro'])
            expect(issue?.message).toBe('Logradouro obrigatório')
        }
    })
})