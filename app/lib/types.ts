// app/lib/types.ts
export enum EventCategory {
    FESTA = 'FESTA',
    BALADA = 'BALADA',
    BAR = 'BAR',
    SHOW = 'SHOW',
    FESTIVAL = 'FESTIVAL',
    TEATRO = 'TEATRO',
    CINEMA = 'CINEMA',
    EXPOSICAO = 'EXPOSICAO',
    DANCA = 'DANCA',
    CIRCO = 'CIRCO',
    STANDUP = 'STANDUP',
    ESPORTE = 'ESPORTE',
    CORRIDA = 'CORRIDA',
    FUTEBOL = 'FUTEBOL',
    WORKSHOP = 'WORKSHOP',
    PALESTRA = 'PALESTRA',
    CONFERENCIA = 'CONFERENCIA',
    CURSO = 'CURSO',
    GASTRONOMICO = 'GASTRONOMICO',
    FEIRA = 'FEIRA',
    INFANTIL = 'INFANTIL',
    RELIGIOSO = 'RELIGIOSO',
    OUTRO = 'OUTRO',
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
    [EventCategory.FESTA]: 'Festa',
    [EventCategory.BALADA]: 'Balada',
    [EventCategory.BAR]: 'Bar',
    [EventCategory.SHOW]: 'Show',
    [EventCategory.FESTIVAL]: 'Festival',
    [EventCategory.TEATRO]: 'Teatro',
    [EventCategory.CINEMA]: 'Cinema',
    [EventCategory.EXPOSICAO]: 'Exposição',
    [EventCategory.DANCA]: 'Dança',
    [EventCategory.CIRCO]: 'Circo',
    [EventCategory.STANDUP]: 'Stand-up',
    [EventCategory.ESPORTE]: 'Esporte',
    [EventCategory.CORRIDA]: 'Corrida',
    [EventCategory.FUTEBOL]: 'Futebol',
    [EventCategory.WORKSHOP]: 'Workshop',
    [EventCategory.PALESTRA]: 'Palestra',
    [EventCategory.CONFERENCIA]: 'Conferência',
    [EventCategory.CURSO]: 'Curso',
    [EventCategory.GASTRONOMICO]: 'Gastronômico',
    [EventCategory.FEIRA]: 'Feira',
    [EventCategory.INFANTIL]: 'Infantil',
    [EventCategory.RELIGIOSO]: 'Religioso',
    [EventCategory.OUTRO]: 'Outro',
}

export interface Evento {
    id: number;
    nome: string;
    descricao?: string;
    endereco: Address;
    vagas: number;
    valor: number;
    data_inicio: string;
    data_fim: string;
    hora_inicio: string;
    hora_fim: string;
    imagem_url?: string;
    id_organizador: string;
    created_at?: string;
    categoria?: EventCategory;
    inscritos?: number;
    organizador_tipo_conta?: AccountType;
}

export interface Usuario {
    id: string
    username: string
    tipo_conta: AccountType
    cnpj?: string
    imagem_url?: string
    nome?: string
}

export interface Address {
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

export interface Conversa {
    id: string;
    nome?: string;
    tipo: 'DM' | 'GRUPO';
    data_criacao: string;
    imagem_url?: string;
}

export interface ConversaParticipante {
    id_conversa: string;
    id_usuario: string;
    ultima_leitura: string;
}

export type ParticipanteInfo = Pick<Usuario, 'id' | 'username' | 'nome' | 'imagem_url'>

export interface ConversaComInfo extends Conversa {
    ultima_leitura: string;
    ultima_mensagem_at?: string;
    participantes: ParticipanteInfo[];
}

export interface Message {
    id: string;
    conteudo: string;
    id_remetente: string;
    id_conversa: string;
    data_criacao: string;
}