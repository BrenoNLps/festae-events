import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from '../services/auth/authService'

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        const { data: { subscription } } = onAuthStateChange(async (_, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    return { user, loading }
}