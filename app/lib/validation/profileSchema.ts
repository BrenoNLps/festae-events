import { z } from 'zod'
import { AccountType } from '../types'
import { validatorUsername, validatorCNPJ } from '../validators'

export const profileSchema = z.object({
    username: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(30, 'Máximo 30 caracteres')
        .refine(validatorUsername, 'Use apenas letras, números, ponto (.), traço (-) e underline (_)'),
    tipo_conta: z.nativeEnum(AccountType),
    cnpj: z.string().optional(),

}).refine((data) => {
    if (data.tipo_conta === AccountType.EMPRESA) {
        return validatorCNPJ(data.cnpj ?? '')
    }
    return true
}, { message: 'CNPJ inválido', path: ['cnpj'] })

export type ProfileFormData = z.infer<typeof profileSchema>
