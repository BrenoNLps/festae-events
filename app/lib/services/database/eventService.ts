import { getSupabaseClient } from "../../supabase/singleton";
import { Address, Evento } from "../../types";
import { getFriendIds } from "./friendshipService";
import { getTodayAsString } from "../../utils/date";

const supabase = getSupabaseClient();

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
    const { data, error } = await supabase.from("evento").insert(values);

    return { data, error };
}

export async function getEvents(filters?: {
    estado?: string;
    cidade?: string;
    categoria?: string;
}): Promise<{ data: Evento[] | null; error: unknown }> {
    let query = supabase.from("evento").select("*");

    if (filters?.estado) query = query.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) query = query.eq("endereco->>cidade", filters.cidade);
    if (filters?.categoria) query = query.eq("categoria", filters.categoria);

    const { data, error } = await query;
    return { data: data as Evento[] | null, error };
}


export async function searchEvents(
    query: string,
    filters?: { estado?: string; cidade?: string; categoria?: string }
): Promise<Evento[]> {
    let q = supabase.from("evento").select("*").ilike("nome", `%${query}%`);
    if (filters?.estado) q = q.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) q = q.eq("endereco->>cidade", filters.cidade);
    if (filters?.categoria) q = q.eq("categoria", filters.categoria);
    const { data } = await q.limit(20);
    return (data ?? []) as Evento[];
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
        .select("evento(*)")
        .in("id_usuario", friendIds);

    const seen = new Set<number>();
    const events: Evento[] = [];

    for (const row of (data ?? []) as { evento: Evento }[]) {
        const e = row.evento;
        if (!e || seen.has(e.id) || e.data_fim < today) continue;
        seen.add(e.id);
        events.push(e);
    }

    return events.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
}
