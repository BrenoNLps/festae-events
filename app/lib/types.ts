// app/lib/types.ts
export interface Evento {
    id: number;
    nome: string;
    descricao?: string;
    endereco: Adress;
    vagas: number;
    valor: number;
    data_inicio: string;
    data_fim: string;
    hora_inicio: string;
    hora_fim: string;
    imagem_url?: string;
    id_organizador: string;
    created_at?: string;
}

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

export interface Message {
    id: number;
    conteudo: string;
    id_remetente: string;
    id_destinatario: string;
    data_criacao: string;
}