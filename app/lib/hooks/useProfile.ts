import { useCallback, useEffect, useState } from 'react'
import { useCurrentUser } from './useCurrentUser'
import { getUserById } from '../services/database/userService'
import { Usuario } from '../types'

export function useProfile() {
    const { user, loading: authLoading } = useCurrentUser()
    const [dbUser, setDbUser] = useState<Usuario | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = useCallback(async (id: string) => {
        const { data } = await getUserById(id)
        setDbUser(data)
    }, [])

    useEffect(() => {
        if (authLoading) return
        if (!user) { setLoading(false); return }

        fetchUser(user.id).then(() => setLoading(false))
    }, [user, authLoading, fetchUser])

    const refresh = useCallback(() => {
        if (user) return fetchUser(user.id)
        return Promise.resolve()
    }, [user, fetchUser])

    return { user, dbUser, loading, refresh }
}
