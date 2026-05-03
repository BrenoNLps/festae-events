// app/lib/types.ts
export interface Usuario {
    id: string
    username: string
    tipo_conta: AccountType
    cnpj?: string
    imagem_url?: string
    perfil_completo: boolean
    nome?: string
}

export interface Adress {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
}

export enum AccountType {
    USUARIO = 'USUARIO',
    EMPRESA = 'EMPRESA'
}