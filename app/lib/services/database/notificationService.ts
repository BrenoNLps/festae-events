import { getSupabaseClient } from "../../supabase/singleton";

const supabase = getSupabaseClient();

export async function getUnreadNotificationCount(tipo: 'amizade' | 'evento'): Promise<number> {
  const { count } = await supabase
    .from('notificacao')
    .select('*', { count: 'exact', head: true })
    .eq('tipo', tipo)
    .eq('lida', false);
  return count ?? 0;
}

export async function markNotificationsAsRead(tipo: 'amizade' | 'evento'): Promise<void> {
  await supabase
    .from('notificacao')
    .update({ lida: true })
    .eq('tipo', tipo)
    .eq('lida', false);
}

export async function insertNotification(id_usuario: string, tipo: 'amizade' | 'evento'): Promise<void> {
  await supabase.from('notificacao').insert({ id_usuario, tipo });
}

export async function insertNotificationsForFriends(friendIds: string[], tipo: 'amizade' | 'evento'): Promise<void> {
  if (friendIds.length === 0) return;
  await supabase.from('notificacao').insert(friendIds.map((id) => ({ id_usuario: id, tipo })));
}
