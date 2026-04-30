import { createClient } from '../supabase/client'

const supabase = createClient()

export async function addFriend(values: {
    id_usuario: string
    id_amigo: string
}) {
    const { data, error } = await supabase
        .from('amizade')
        .insert(values)

    return { data, error }
}

export async function getFriends(id_usuario: string) {
    const { data, error } = await supabase
        .from('amizade')
        .select('*, usuario!amizade_id_amigo_fkey(*)')
        .eq('id_usuario', id_usuario)

    return { data, error }
}

export async function removeFriend(id_usuario: string, id_amigo: string) {
    const { data, error } = await supabase
        .from('amizade')
        .delete()
        .eq('id_usuario', id_usuario)
        .eq('id_amigo', id_amigo)

    return { data, error }
}

export async function getFriendsAtEvent(id_usuario: string, id_evento: number) {
    const { data, error } = await supabase
        .from('amizade')
        .select('*, usuario!amizade_id_amigo_fkey(*), inscricao!inner(*)')
        .eq('id_usuario', id_usuario)
        .eq('inscricao.id_evento', id_evento)

    return { data, error }
}