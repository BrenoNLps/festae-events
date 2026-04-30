import { createClient } from "../../supabase/client";

const supabase = createClient();

export async function createRegistration(values: {
  id_usuario: string;
  id_evento: number;
}) {
  const { data, error } = await supabase.from("inscricao").insert(values);

  return { data, error };
}

export async function getRegistrationsByUser(id_usuario: string) {
  const { data, error } = await supabase
    .from("inscricao")
    .select("*, evento(*)")
    .eq("id_usuario", id_usuario);

  return { data, error };
}

export async function getRegistrationsByEvent(id_evento: number) {
  const { data, error } = await supabase
    .from("inscricao")
    .select("*, usuario(*)")
    .eq("id_evento", id_evento);

  return { data, error };
}

/*
export async function updateRegistration(id: number, status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO') {
    const { data, error } = await supabase
        .from('inscricao')
        .update({ status })
        .eq('id', id)

    return { data, error }
}

export async function deleteRegistration(id: number) {
    const { data, error } = await supabase
        .from('inscricao')
        .delete()
        .eq('id', id)

    return { data, error }
}
*/
