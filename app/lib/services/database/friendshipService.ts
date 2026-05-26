import { getSupabaseClient } from "../../supabase/singleton";
import { Usuario } from "../../types";
import { insertNotification } from "./notificationService";

const supabase = getSupabaseClient();

export async function getFriendIds(userId: string): Promise<string[]> {
  const [sent, received] = await Promise.all([
    supabase.from("amizade").select("id_amigo").eq("id_usuario", userId).eq("status", "aceito"),
    supabase.from("amizade").select("id_usuario").eq("id_amigo", userId).eq("status", "aceito"),
  ]);

  return [
    ...(sent.data ?? []).map((r: { id_amigo: string }) => r.id_amigo),
    ...(received.data ?? []).map((r: { id_usuario: string }) => r.id_usuario),
  ];
}

export async function sendFriendRequest(values: {
  id_usuario: string;
  id_amigo: string;
}) {
  const { data, error } = await supabase.from("amizade").insert(values);
  if (!error) await insertNotification(values.id_amigo, 'amizade');
  return { data, error };
}

export async function getFriends(id_usuario: string): Promise<{ data: Usuario[]; error: unknown }> {
  const [sent, received] = await Promise.all([
    supabase
      .from("amizade")
      .select("*, amigo:usuario!id_amigo(*)")
      .eq("id_usuario", id_usuario)
      .eq("status", "aceito"),
    supabase
      .from("amizade")
      .select("*, remetente:usuario!id_usuario(*)")
      .eq("id_amigo", id_usuario)
      .eq("status", "aceito"),
  ]);

  const friends = [
    ...(sent.data ?? []).map((r: { amigo: Usuario }) => r.amigo),
    ...(received.data ?? []).map((r: { remetente: Usuario }) => r.remetente),
  ].filter((f): f is Usuario => Boolean(f));

  return { data: friends, error: sent.error ?? received.error };
}

export async function getPendingReceived(id_usuario: string) {
  const { data, error } = await supabase
    .from("amizade")
    .select("*, remetente:usuario!id_usuario(*)")
    .eq("id_amigo", id_usuario)
    .eq("status", "pendente");

  return { data, error };
}

export async function getPendingSent(id_usuario: string) {
  const { data, error } = await supabase
    .from("amizade")
    .select("*, amigo:usuario!id_amigo(*)")
    .eq("id_usuario", id_usuario)
    .eq("status", "pendente");

  return { data, error };
}

export async function acceptFriend(id_usuario: string, id_amigo: string) {
  const { error } = await supabase
    .from("amizade")
    .update({ status: "aceito" })
    .eq("id_usuario", id_usuario)
    .eq("id_amigo", id_amigo);

  return { error };
}

export async function declineFriend(id_usuario: string, id_amigo: string) {
  const { error } = await supabase
    .from("amizade")
    .delete()
    .eq("id_usuario", id_usuario)
    .eq("id_amigo", id_amigo);

  return { error };
}

export async function removeFriend(id_usuario: string, id_amigo: string) {
  const { error } = await supabase
    .from("amizade")
    .delete()
    .or(
      `and(id_usuario.eq.${id_usuario},id_amigo.eq.${id_amigo}),and(id_usuario.eq.${id_amigo},id_amigo.eq.${id_usuario})`
    );

  return { error };
}

export async function getFriendsAtEvent(userId: string, eventoId: number): Promise<Usuario[]> {
  const friendIds = await getFriendIds(userId);

  if (friendIds.length === 0) return [];

  const { data } = await supabase
    .from("inscricao")
    .select("usuario(*)")
    .eq("id_evento", eventoId)
    .in("id_usuario", friendIds);

  return ((data ?? []) as unknown as { usuario: Usuario }[]).map((r) => r.usuario).filter((u): u is Usuario => Boolean(u));
}
