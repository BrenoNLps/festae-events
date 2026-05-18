import { formatDateRange, formatDay } from '@/app/lib/utils/date'

describe('formatDay', () => {
    // Happy path: data ISO convertida corretamente para DD/MM
    it('formata data ISO para DD/MM', () => {
        expect(formatDay('2024-06-15')).toBe('15/06')
    })

    // Edge case: dia e mês com único dígito devem receber zero à esquerda
    it('preserva zero à esquerda no dia e mês', () => {
        expect(formatDay('2024-01-05')).toBe('05/01')
    })
})

describe('formatDateRange', () => {
    // Happy path: datas diferentes geram intervalo no formato "DD/MM – DD/MM"
    it('retorna intervalo quando datas são diferentes', () => {
        expect(formatDateRange('2024-06-15', '2024-06-20')).toBe('15/06 – 20/06')
    })

    // Edge case: início e fim iguais devem retornar data única, sem intervalo
    it('retorna data única quando início e fim são iguais', () => {
        expect(formatDateRange('2024-06-15', '2024-06-15')).toBe('15/06')
    })

    // Edge case: intervalo cruzando virada de mês
    it('funciona com meses diferentes', () => {
        expect(formatDateRange('2024-06-28', '2024-07-02')).toBe('28/06 – 02/07')
    })
})