import { getSupabaseClient } from "../../supabase/singleton";

const supabase = getSupabaseClient();

export async function createEvent(values: {
    nome: string;
    descricao?: string;
    endereco: {
        cep: string;
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
    };
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

export async function getEvents() {
    const { data, error } = await supabase.from("evento").select("*");

    return { data, error };
}

export async function getEventById(id: number) {
    const { data, error } = await supabase
    .from("evento")
    .select("*")
    .eq("id", id)
    .single();

    return { data, error };
}

export async function deleteEvent(id: number) {
    const { data, error } = await supabase.from("evento").delete().eq("id", id);

    return { data, error };
}
