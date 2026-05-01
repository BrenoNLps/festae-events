import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

import { getSupabaseClient } from '../supabase/singleton'

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = getSupabaseClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    }, [])

    return user
}