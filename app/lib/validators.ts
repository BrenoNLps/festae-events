export function validatorUsername(username: string): boolean {
    return /^[a-zA-Z0-9._-]{3,30}$/.test(username)
}

export function validatorCEP(cep: string): boolean {
    return /^\d{8}$/.test(cep)
}

export function validatorCNPJ(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '')

    if (digits.length !== 14) return false
    if (/^(\d)\1{13}$/.test(digits)) return false

    const calcDigit = (slice: string, weights: number[]) => {
        const sum = slice.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0)
        const rem = sum % 11
        return rem < 2 ? 0 : 11 - rem
    }

    const d1 = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    const d2 = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

    return d1 === Number(digits[12]) && d2 === Number(digits[13])
}

export function maskCurrency(digits: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 8)
    if (!d) return ''
    return (parseInt(d, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseCurrency(input: string): number {
    const d = input.replace(/\D/g, '').slice(0, 8)
    return d ? parseInt(d, 10) / 100 : 0
}

export function maskCNPJ(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}
