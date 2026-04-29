'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import LoadingOverlay from '@/app/components/(protected)/LoadingOverlay'

export default function AuthListener() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                setLoading(true)
                router.push('/events')
                setTimeout(() => setLoading(false), 600)
            }
            if (event === 'SIGNED_OUT') {
                setLoading(true)
                router.push('/login')
                setTimeout(() => setLoading(false), 600)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    if (!loading) return null

    return <LoadingOverlay />
}