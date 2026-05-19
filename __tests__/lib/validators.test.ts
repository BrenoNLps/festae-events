import {
    validatorUsername,
    validatorCEP,
    validatorCNPJ,
    maskCurrency,
    parseCurrency,
    maskCNPJ,
} from '@/app/lib/validators'

describe('validatorUsername', () => {
    // Happy path: username alfanumérico simples deve ser aceito
    it('aceita username válido', () => {
        expect(validatorUsername('joao123')).toBe(true)
    })

    // Happy path: caracteres especiais permitidos (ponto, traço, underline) devem ser aceitos
    it('aceita com ponto, traço e underline', () => {
        expect(validatorUsername('j.oao_jo-ao')).toBe(true)
    })

    // Edge case: username no limite mínimo de 3 caracteres deve ser aceito
    it('aceita username com exatamente 3 caracteres', () => {
        expect(validatorUsername('abc')).toBe(true)
    })

    // Edge case: username no limite máximo de 30 caracteres deve ser aceito
    it('aceita username com exatamente 30 caracteres', () => {
        expect(validatorUsername('a'.repeat(30))).toBe(true)
    })

    // Edge case: username abaixo do mínimo de 3 caracteres deve ser rejeitado
    it('rejeita username com menos de 3 caracteres', () => {
        expect(validatorUsername('ab')).toBe(false)
    })

    // Edge case: username acima do limite de 30 caracteres deve ser rejeitado
    it('rejeita username com mais de 30 caracteres', () => {
        expect(validatorUsername('a'.repeat(31))).toBe(false)
    })

    // Edge case: caracteres especiais não permitidos devem ser rejeitados
    it('rejeita caracteres especiais', () => {
        expect(validatorUsername('joao@mail')).toBe(false)
    })

    // Edge case: espaços não são permitidos no username
    it('rejeita espaços', () => {
        expect(validatorUsername('joao 123')).toBe(false)
    })
})

describe('validatorCEP', () => {
    // Happy path: CEP com exatamente 8 dígitos deve ser aceito
    it('aceita CEP com 8 dígitos', () => {
        expect(validatorCEP('01310100')).toBe(true)
    })

    // Edge case: CEP com 7 dígitos deve ser rejeitado
    it('rejeita CEP com 7 dígitos', () => {
        expect(validatorCEP('0131010')).toBe(false)
    })

    // Edge case: CEP com 9 dígitos deve ser rejeitado
    it('rejeita CEP com 9 dígitos', () => {
        expect(validatorCEP('013101000')).toBe(false)
    })

    // Edge case: CEP com letras deve ser rejeitado
    it('rejeita CEP com letras', () => {
        expect(validatorCEP('0131010a')).toBe(false)
    })

    // Edge case: CEP formatado com máscara deve ser rejeitado, só dígitos são aceitos
    it('rejeita CEP com máscara', () => {
        expect(validatorCEP('01310-100')).toBe(false)
    })
})

describe('validatorCNPJ', () => {
    // Happy path: CNPJ válido sem máscara deve ser aceito
    it('aceita CNPJ válido sem máscara', () => {
        expect(validatorCNPJ('11444777000161')).toBe(true)
    })

    // Happy path: CNPJ válido com máscara formatada deve ser aceito
    it('aceita CNPJ válido com máscara', () => {
        expect(validatorCNPJ('11.444.777/0001-61')).toBe(true)
    })

    // Edge case: CNPJ com todos os dígitos iguais é tecnicamente inválido pela regra do algoritmo
    it('rejeita CNPJ com todos os dígitos iguais', () => {
        expect(validatorCNPJ('11111111111111')).toBe(false)
    })

    // Edge case: CNPJ com dígito verificador incorreto deve ser rejeitado
    it('rejeita CNPJ com dígito verificador errado', () => {
        expect(validatorCNPJ('11444777000160')).toBe(false)
    })

    // Edge case: CNPJ com menos de 14 dígitos deve ser rejeitado
    it('rejeita CNPJ com menos de 14 dígitos', () => {
        expect(validatorCNPJ('1144477700016')).toBe(false)
    })

    // Edge case: CNPJ com mais de 14 dígitos deve ser rejeitado após strip de não-dígitos
    it('rejeita CNPJ com mais de 14 dígitos', () => {
        expect(validatorCNPJ('114447770001610')).toBe(false)
    })
})

describe('maskCurrency', () => {
    // Happy path: valor numérico string formatado corretamente como centavos
    it('formata centavos corretamente', () => {
        expect(maskCurrency('100')).toBe('1,00')
    })

    // Happy path: valor maior formatado com casas decimais corretas
    it('formata valor inteiro corretamente', () => {
        expect(maskCurrency('10000')).toBe('100,00')
    })

    // Edge case: entrada vazia deve retornar string vazia
    it('retorna string vazia para entrada vazia', () => {
        expect(maskCurrency('')).toBe('')
    })

    // Edge case: caracteres não numéricos devem ser ignorados antes de formatar
    it('ignora caracteres não numéricos', () => {
        expect(maskCurrency('R$ 1,00')).toBe('1,00')
    })

    // Boundary: entrada acima do limite de 8 dígitos deve ser truncada antes de formatar
    it('trunca entrada com mais de 8 dígitos', () => {
        expect(maskCurrency('1000000000')).toBe('100.000,00')
    })
})

describe('parseCurrency', () => {
    // Happy path: string "1,00" deve ser convertida para o número 1
    it('converte "1,00" para 1', () => {
        expect(parseCurrency('1,00')).toBe(1)
    })

    // Happy path: string "100,00" deve ser convertida para o número 100
    it('converte "100,00" para 100', () => {
        expect(parseCurrency('100,00')).toBe(100)
    })

    // Edge case: entrada vazia deve retornar 0
    it('retorna 0 para entrada vazia', () => {
        expect(parseCurrency('')).toBe(0)
    })

    // Edge case: caracteres não numéricos devem ser ignorados antes de converter
    it('ignora caracteres não numéricos', () => {
        expect(parseCurrency('R$ 50,00')).toBe(50)
    })
})

describe('maskCNPJ', () => {
    // Happy path: 14 dígitos devem gerar a máscara completa do CNPJ
    it('aplica traço ao atingir 13 dígitos', () => {
        expect(maskCNPJ('11444777000161')).toBe('11.444.777/0001-61')
    })

    // Edge case: até 2 dígitos ainda não aplica nenhuma máscara
    it('retorna somente dígitos para até 2 caracteres', () => {
        expect(maskCNPJ('11')).toBe('11')
    })

    // Edge case: ao atingir 3 dígitos aplica o primeiro ponto
    it('aplica primeiro ponto ao atingir 3 dígitos', () => {
        expect(maskCNPJ('114')).toBe('11.4')
    })

    // Edge case: ao atingir 6 dígitos aplica o segundo ponto
    it('aplica segundo ponto ao atingir 6 dígitos', () => {
        expect(maskCNPJ('114447')).toBe('11.444.7')
    })

    // Edge case: ao atingir 9 dígitos aplica a barra
    it('aplica barra ao atingir 9 dígitos', () => {
        expect(maskCNPJ('114447770')).toBe('11.444.777/0')
    })
})