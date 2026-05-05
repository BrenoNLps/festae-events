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

export async function getEvents(): Promise<{ data: Evento[] | null; error: unknown }> {
    const { data, error } = await supabase.from("evento").select("*");

    return { data: data as Evento[] | null, error };
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
