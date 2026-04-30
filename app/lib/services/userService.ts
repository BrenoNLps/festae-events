import { createClient } from '../supabase/client'

const supabase = createClient()

export async function getUserById(id: string) {
    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id', id)
        .single()

    return { data, error }
}

export async function completeProfile(id: string, values: {
    username: string
    tipo_conta: 'USUARIO' | 'EMPRESA'
    cnpj?: string
    imagem_url?: string
}) {
    const { data, error } = await supabase
        .from('usuario')
        .update(values)
        .eq('id', id)

    return { data, error }
}

export async function updateProfile(id: string, values: {
    nome?: string
    username?: string
    imagem_url?: string
}) {
    const { data, error } = await supabase
        .from('usuario')
        .update(values)
        .eq('id', id)

    return { data, error }
}