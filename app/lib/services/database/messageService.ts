import { getSupabaseClient } from "../../supabase/singleton";
import { ConversaComInfo, Message } from "../../types";

const supabase = getSupabaseClient();

export async function getOrCreateDMConversation(outroUsuarioId: string): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('criar_conversa_dm', { outro_usuario: outroUsuarioId });
  return { data: data as string | null, error };
}

export async function createGroup(nome: string, participantes: string[]): Promise<{ data: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('criar_grupo', { nome_grupo: nome, participantes });
  return { data: data as string | null, error };
}

export async function getMyConversations(): Promise<{ data: ConversaComInfo[]; error: unknown }> {
  const { data, error } = await supabase.rpc('get_my_conversations');
  return { data: (data as ConversaComInfo[] | null) ?? [], error };
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

export async function leaveGroup(id_conversa: string, id_usuario: string) {
  return supabase
    .from('conversa_participante')
    .delete()
    .eq('id_conversa', id_conversa)
    .eq('id_usuario', id_usuario);
}

export async function addToGroup(id_conversa: string, novo_usuario: string) {
  return supabase.rpc('adicionar_ao_grupo', { id_conversa_param: id_conversa, novo_usuario });
}

export async function updateGroupImage(id_conversa: string, imagem_url: string | null) {
  return supabase.rpc('atualizar_imagem_grupo', { id_conversa_param: id_conversa, nova_imagem: imagem_url });
}

export async function getUnreadConversationIds(): Promise<{ data: string[]; error: unknown }> {
  const { data, error } = await supabase.rpc('get_unread_conversation_ids');
  return { data: (data as string[] | null) ?? [], error };
}
