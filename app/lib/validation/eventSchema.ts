import { z } from 'zod'

const enderecoSchema = z.object({
    cep: z.string().length(8, 'CEP inválido'),
    logradouro: z.string().min(1, 'Logradouro obrigatório'),
    numero: z.string().min(1, 'Número obrigatório'),
    bairro: z.string().min(1, 'Bairro obrigatório'),
    cidade: z.string().min(1, 'Cidade obrigatória'),
    estado: z.string().min(1, 'Estado obrigatório'),
})

export const eventSchema = z.object({
    nome: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres'),
    descricao: z.string().optional(),
    vagas: z.number({ invalid_type_error: 'Informe um número' }).int('Deve ser número inteiro').positive('Mínimo 1 vaga'),
    valor: z.preprocess(
        (val) => typeof val === 'number' && isNaN(val) ? 0 : val,
        z.number({ invalid_type_error: 'Informe um número' }).min(0, 'Valor não pode ser negativo')
    ),
    data_inicio: z.string().min(1, 'Data de início obrigatória'),
    data_fim: z.string().min(1, 'Data de fim obrigatória'),
    hora_inicio: z.string().min(1, 'Hora de início obrigatória'),
    hora_fim: z.string().min(1, 'Hora de fim obrigatória'),
    endereco: enderecoSchema,
}).refine(
    (data) => !data.data_inicio || !data.data_fim || data.data_fim >= data.data_inicio,
    { message: 'Data de fim deve ser após a data de início', path: ['data_fim'] }
)

export type EventFormData = z.infer<typeof eventSchema>
