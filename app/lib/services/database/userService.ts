import { Usuario } from "../../types";
import { getSupabaseClient } from "../../supabase/singleton";

const supabase = getSupabaseClient();

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("usuario")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

export async function completeProfile(
  id: string,
  values: {
    username: string;
    tipo_conta: "USUARIO" | "EMPRESA";
    cnpj?: string;
    imagem_url?: string;
  },
) {
  const { data, error } = await supabase
    .from("usuario")
    .update(values)
    .eq("id", id);

  return { data, error };
}

export async function updateProfile(
  id: string,
  values: {
    nome?: string;
    username?: string;
    imagem_url?: string;
  },
) {
  const { data, error } = await supabase
    .from("usuario")
    .update(values)
    .eq("id", id);

  return { data, error };
}

function escapeLike(value: string): string {
  if (value.includes('\x00')) throw new Error('Input inválido')
  if (value.length > 200) throw new Error('Input muito longo')
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export async function searchUsers(
  query: string,
  excludeId?: string,
  limit = 5,
): Promise<Usuario[]> {
  let q = supabase
    .from("usuario")
    .select("id, username, nome, imagem_url, tipo_conta")
    .ilike("username", `%${escapeLike(query)}%`)
    .limit(limit * 3);

  if (excludeId) q = q.neq("id", excludeId);

  const { data } = await q;
  if (!data) return [];

  const lower = query.toLowerCase();
  return data
    .sort((a, b) => {
      const score = (u: typeof a) => {
        const un = u.username?.toLowerCase() ?? "";
        if (un === lower) return 0;
        if (un.startsWith(lower)) return 1;
        return 2;
      };
      const diff = score(a) - score(b);
      if (diff !== 0) return diff;
      return (a.username?.length ?? 0) - (b.username?.length ?? 0);
    })
    .slice(0, limit);
}
