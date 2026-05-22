import { getSupabaseClient } from "../../supabase/singleton";
import { Message } from "../../types";

const supabase = getSupabaseClient();

export async function getOrCreateDMConversation(outroUsuarioId: string): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('criar_conversa_dm', { outro_usuario: outroUsuarioId });
  return { data: data as string | null, error };
}

export async function getMessagesByConversation(id_conversa: string): Promise<{ data: Message[] | null; error: unknown }> {
  const { data, error } = await supabase
    .from('mensagem')
    .select('*')
    .eq('id_conversa', id_conversa)
    .order('data_criacao', { ascending: true });
  return { data: data as Message[] | null, error };
}

export async function sendMessage(values: {
  conteudo: string;
  id_remetente: string;
  id_conversa: string;
}) {
  return supabase.from('mensagem').insert(values);
}

export async function markConversationAsRead(id_conversa: string, id_usuario: string) {
  return supabase
    .from('conversa_participante')
    .update({ ultima_leitura: new Date().toISOString() })
    .eq('id_conversa', id_conversa)
    .eq('id_usuario', id_usuario);
}

export async function getUnreadDMPartnerIds(): Promise<{ data: string[]; error: unknown }> {
  const { data, error } = await supabase.rpc('get_unread_dm_partner_ids');
  return { data: (data as string[] | null) ?? [], error };
}
