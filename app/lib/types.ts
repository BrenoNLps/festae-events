// app/lib/types.ts
export interface Adress {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
}

export type AccountType = 'USUARIO' | 'EMPRESA'