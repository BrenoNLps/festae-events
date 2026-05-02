export function validatorCNPJ(cnpj: string): boolean {
    const onlyNumbers = cnpj.replace(/\D/g, "");
    return /^\d{14}$/.test(onlyNumbers);
}