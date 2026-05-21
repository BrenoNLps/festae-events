import { getSupabaseClient } from "../../supabase/singleton";
import { Adress, Evento } from "../../types";

const supabase = getSupabaseClient();

export async function createEvent(values: {
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
}) {
    const { data, error } = await supabase.from("evento").insert(values);

    return { data, error };
}

export async function getEvents(filters?: {
    estado?: string;
    cidade?: string;
}): Promise<{ data: Evento[] | null; error: unknown }> {
    let query = supabase.from("evento").select("*");

    if (filters?.estado) query = query.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) query = query.eq("endereco->>cidade", filters.cidade);

    const { data, error } = await query;
    return { data: data as Evento[] | null, error };
}


export async function searchEvents(
    query: string,
    filters?: { estado?: string; cidade?: string }
): Promise<Evento[]> {
    let q = supabase.from("evento").select("*").ilike("nome", `%${query}%`);
    if (filters?.estado) q = q.eq("endereco->>estado", filters.estado);
    if (filters?.cidade) q = q.eq("endereco->>cidade", filters.cidade);
    const { data } = await q.limit(20);
    return (data as Evento[]) ?? [];
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

export async function deleteEvent(id: number) {
    const { data, error } = await supabase.from("evento").delete().eq("id", id);

    return { data, error };
}

export async function getEventsByFriends(userId: string): Promise<Evento[]> {
    const today = new Date().toISOString().split("T")[0];

    const [sent, received] = await Promise.all([
        supabase.from("amizade").select("id_amigo").eq("id_usuario", userId).eq("status", "aceito"),
        supabase.from("amizade").select("id_usuario").eq("id_amigo", userId).eq("status", "aceito"),
    ]);

    const friendIds = [
        ...(sent.data ?? []).map((r: { id_amigo: string }) => r.id_amigo),
        ...(received.data ?? []).map((r: { id_usuario: string }) => r.id_usuario),
    ];

    if (friendIds.length === 0) return [];

    const { data } = await supabase
        .from("inscricao")
        .select("evento(*)")
        .in("id_usuario", friendIds);

    const seen = new Set<number>();
    const events: Evento[] = [];

    for (const row of data ?? []) {
        const e = (row as { evento: Evento }).evento;
        if (!e || seen.has(e.id) || e.data_fim < today) continue;
        seen.add(e.id);
        events.push(e);
    }

    return events.sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
}
