import { getSupabaseClient } from "../../supabase/singleton";

const supabase = getSupabaseClient();

export async function sendFriendRequest(values: {
  id_usuario: string;
  id_amigo: string;
}) {
  const { data, error } = await supabase.from("amizade").insert(values);
  return { data, error };
}

export async function getFriends(id_usuario: string) {
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
    ...(sent.data ?? []).map((r: { amigo: unknown }) => r.amigo),
    ...(received.data ?? []).map((r: { remetente: unknown }) => r.remetente),
  ];

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

export async function getFriendsAtEvent(id_usuario: string, id_evento: number) {
  const { data, error } = await supabase
    .from("amizade")
    .select("*, usuario!amizade_id_amigo_fkey(*), inscricao!inner(*)")
    .eq("id_usuario", id_usuario)
    .eq("status", "aceito")
    .eq("inscricao.id_evento", id_evento);

  return { data, error };
}
