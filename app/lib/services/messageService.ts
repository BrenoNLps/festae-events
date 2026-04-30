import { createClient } from '../supabase/client'

const supabase = createClient()

export async function sendMessage(values: {
    conteudo: string
    id_remetente: string
    id_destinatario: string
}) {
    const { data, error } = await supabase
        .from('mensagem')
        .insert(values)

    return { data, error }
}

export async function getMessagesBetweenUsers(id_remetente: string, id_destinatario: string) {
    const { data, error } = await supabase
        .from('mensagem')
        .select('*')
        .or(`and(id_remetente.eq.${id_remetente},id_destinatario.eq.${id_destinatario}),and(id_remetente.eq.${id_destinatario},id_destinatario.eq.${id_remetente})`)
        .order('data_criacao', { ascending: true })

    return { data, error }
}

/* 
export async function deleteMessage(id: number) {
    const { data, error } = await supabase
        .from('mensagem')
        .delete()
        .eq('id', id)

    return { data, error }
}
*/
