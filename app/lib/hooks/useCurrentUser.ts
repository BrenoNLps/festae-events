import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

import { getSupabaseClient } from '../supabase/singleton'

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Busca o usuário atual ao montar o componente
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Atualiza o estado do usuário quando ocorrer mudanças no estado de autenticação (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null)
        }) 
        return () => subscription.unsubscribe()

    }, [])

    return { user, loading }
}