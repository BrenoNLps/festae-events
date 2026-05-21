import { getSupabaseClient } from "../../supabase/singleton";

const supabase = getSupabaseClient();

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

export async function checkRegistration(id_usuario: string, id_evento: number) {
  const { data, error } = await supabase
    .from("inscricao")
    .select("id")
    .eq("id_usuario", id_usuario)
    .eq("id_evento", id_evento)
    .maybeSingle();

  return { data, error };
}

export async function deleteRegistration(id_usuario: string, id_evento: number) {
  const { error } = await supabase
    .from("inscricao")
    .delete()
    .eq("id_usuario", id_usuario)
    .eq("id_evento", id_evento);

  return { error };
}

export async function getRegistrationCount(id_evento: number): Promise<number> {
  const { data } = await supabase.rpc("get_registration_count", { evento_id: id_evento });
  return data ?? 0;
}
