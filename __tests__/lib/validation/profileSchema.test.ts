import { profileSchema } from '@/app/lib/validation/profileSchema'
import { AccountType } from '@/app/lib/types'

const CNPJ_VALIDO = '11.444.777/0001-61'
const CNPJ_INVALIDO = '11.444.777/0001-60'

describe('profileSchema', () => {
    // Happy path: perfil de usuário comum com dados válidos deve ser aceito
    it('valida perfil de usuário comum', () => {
        const result = profileSchema.safeParse({
            username: 'joao123',
            tipo_conta: AccountType.USUARIO,
        })
        expect(result.success).toBe(true)
    })

    // Happy path: perfil de empresa com CNPJ válido deve ser aceito
    it('valida perfil de empresa com CNPJ válido', () => {
        const result = profileSchema.safeParse({
            username: 'minhaempresa',
            tipo_conta: AccountType.EMPRESA,
            cnpj: CNPJ_VALIDO,
        })
        expect(result.success).toBe(true)
    })

    // Happy path: CNPJ é opcional para usuário comum, deve ser aceito sem ele
    it('não exige CNPJ para usuário comum', () => {
        const result = profileSchema.safeParse({
            username: 'joao123',
            tipo_conta: AccountType.USUARIO,
            cnpj: undefined,
        })
        expect(result.success).toBe(true)
    })

    // Edge case: empresa sem CNPJ deve ser rejeitada com mensagem adequada
    it('rejeita empresa sem CNPJ com mensagem correta', () => {
        const result = profileSchema.safeParse({
            username: 'minhaempresa',
            tipo_conta: AccountType.EMPRESA,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues[0]
            expect(issue.path).toEqual(['cnpj'])
            expect(issue.message).toBe('CNPJ inválido (deve ter 14 dígitos)')
        }
    })

    // Edge case: CNPJ com dígito verificador incorreto deve ser rejeitado
    it('rejeita empresa com CNPJ inválido com mensagem correta', () => {
        const result = profileSchema.safeParse({
            username: 'minhaempresa',
            tipo_conta: AccountType.EMPRESA,
            cnpj: CNPJ_INVALIDO,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues[0]
            expect(issue.path).toEqual(['cnpj'])
            expect(issue.message).toBe('CNPJ inválido (deve ter 14 dígitos)')
        }
    })

    // Edge case: username com menos de 3 caracteres deve ser rejeitado
    it('rejeita username com menos de 3 caracteres com mensagem correta', () => {
        const result = profileSchema.safeParse({
            username: 'ab',
            tipo_conta: AccountType.USUARIO,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues.find(i => i.path[0] === 'username')
            expect(issue?.message).toBe('Mínimo 3 caracteres')
        }
    })

    // Edge case: username acima do limite de 30 caracteres deve ser rejeitado
    it('rejeita username com mais de 30 caracteres', () => {
        const result = profileSchema.safeParse({
            username: 'a'.repeat(31),
            tipo_conta: AccountType.USUARIO,
        })
        expect(result.success).toBe(false)
    })

    // Edge case: username com caracteres especiais não permitidos deve ser rejeitado
    it('rejeita username com caracteres inválidos com mensagem correta', () => {
        const result = profileSchema.safeParse({
            username: 'joao@email',
            tipo_conta: AccountType.USUARIO,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            const issue = result.error.issues[0]
            expect(issue.path).toEqual(['username'])
            expect(issue.message).toBe('Use apenas letras, números, ponto (.), traço (-) e underline (_)')
        }
    })
})