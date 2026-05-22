import { getSupabaseClient } from "../../supabase/singleton";
import { Message } from "../../types";

const supabase = getSupabaseClient();

export async function sendMessage(values: {
  conteudo: string;
  id_remetente: string;
  id_destinatario: string;
}) {
  const { data, error } = await supabase.from("mensagem").insert(values);

  return { data, error };
}

export async function getUnreadSenderIds(id_destinatario: string, after: string) {
  const { data, error } = await supabase
    .from("mensagem")
    .select("id_remetente")
    .eq("id_destinatario", id_destinatario)
    .gt("data_criacao", after);

  const ids = [...new Set((data ?? []).map((m: { id_remetente: string }) => m.id_remetente))];
  return { data: ids, error };
}

export async function getMessagesBetweenUsers(
  id_remetente: string,
  id_destinatario: string,
): Promise<{ data: Message[] | null; error: unknown }> {
  const { data, error } = await supabase
    .from("mensagem")
    .select("*")
    .or(
      `and(id_remetente.eq.${id_remetente},id_destinatario.eq.${id_destinatario}),and(id_remetente.eq.${id_destinatario},id_destinatario.eq.${id_remetente})`,
    )
    .order("data_criacao", { ascending: true });

  return { data: data as Message[] | null, error };
}
