export function validatorCEP(cep: string): boolean {
    return /^\d{8}$/.test(cep);
}
