import { getSupabaseClient } from "../../supabase/singleton";
import { Address, Evento } from "../../types";
import { getFriendIds } from "./friendshipService";
import { getTodayAsString } from "../../utils/date";

const supabase = getSupabaseClient();

const HTML_PATTERN = /<[^>]+>/i

function assertNoHtml(value: string, field: string) {
    if (value.includes('\x00')) throw new Error(`${field}: input inválido`)
    if (HTML_PATTERN.test(value)) throw new Error(`${field}: conteúdo HTML não permitido`)
}

type EventoRaw = Evento & { inscricao: { count: number }[] };

function mapInscritos(data: EventoRaw[]): Evento[] {
    return data.map(({ inscricao, ...e }) => ({ ...e, inscritos: inscricao?.[0]?.count ?? 0 }));
}

export async function createEvent(values: {
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
}) {
    assertNoHtml(values.nome, 'nome')
    if (values.descricao) assertNoHtml(values.descricao, 'descricao')

    const { data, error } = await supabase.from("evento").insert(values).select('id').single();

    return { data, error };
}

export async function getEvents(filters?: {
    estado?: string;
    cidade?: string;
    categoria?: string;
}): Promise<{ data: Evento[] | null; error: unknown }> {
    let query = supabase.from("evento").select("*, inscricao(count)");

    if (filters?.estado) query = query.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) query = query.eq("endereco->>cidade", filters.cidade);
    if (filters?.categoria) query = query.eq("categoria", filters.categoria);

    const { data, error } = await query;
    return { data: data ? mapInscritos(data as EventoRaw[]) : null, error };
}


function escapeLike(value: string): string {
    if (value.includes('\x00')) throw new Error('Input inválido')
    if (value.length > 200) throw new Error('Input muito longo')
    return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export async function searchEvents(
    query: string,
    filters?: { estado?: string; cidade?: string; categoria?: string }
): Promise<Evento[]> {
    let q = supabase.from("evento").select("*, inscricao(count)").ilike("nome", `%${escapeLike(query)}%`);
    if (filters?.estado) q = q.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) q = q.eq("endereco->>cidade", filters.cidade);
    if (filters?.categoria) q = q.eq("categoria", filters.categoria);
    const { data } = await q.limit(20);
    return mapInscritos((data ?? []) as EventoRaw[]);
}

export async function getEventsByOrganizer(id_organizador: string): Promise<{ data: Evento[] | null; error: unknown }> {
    const { data, error } = await supabase
        .from("evento")
        .select("*")
        .eq("id_organizador", id_organizador);

    return { data: data as Evento[] | null, error };
}

export async function getEventById(id: number): Promise<{ data: Evento | null; error: unknown }> {
    const { data, error } = await supabase
        .from("evento")
        .select("*")
        .eq("id", id)
        .single();

    return { data: data as Evento | null, error };
}

export async function updateEvent(id: number, values: {
    nome?: string;
    descricao?: string;
    endereco?: Address;
    vagas?: number;
    valor?: number;
    data_inicio?: string;
    data_fim?: string;
    hora_inicio?: string;
    hora_fim?: string;
    imagem_url?: string;
}) {
    const { data, error } = await supabase.from("evento").update(values).eq("id", id);
    return { data, error };
}

export async function deleteEvent(id: number) {
    const { data, error } = await supabase.from("evento").delete().eq("id", id);

    return { data, error };
}

export async function getEventsByFriends(userId: string): Promise<Evento[]> {
    const today = getTodayAsString();

    const friendIds = await getFriendIds(userId);

    if (friendIds.length === 0) return [];

    const { data } = await supabase
        .from("inscricao")
        .select("evento(*, inscricao(count))")
        .in("id_usuario", friendIds);

    const seen = new Set<number>();
    const events: Evento[] = [];

    for (const row of (data ?? []) as unknown as { evento: Evento & { inscricao: { count: number }[] } }[]) {
        const e = row.evento;
        if (!e || seen.has(e.id) || e.data_fim < today) continue;
        seen.add(e.id);
        events.push(mapInscritos([e])[0]);
    }

    return events.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
}
