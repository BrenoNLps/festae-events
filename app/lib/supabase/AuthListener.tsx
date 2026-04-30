'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import LoadingOverlay from '@/app/components/LoadingOverlay'
import { PROTECTED_ROUTES, ROUTES } from '../routes'

export default function AuthListener() {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' && !PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
                setLoading(true)
                router.push(ROUTES.events)
                setTimeout(() => setLoading(false), 600)
            }
            if (event === 'SIGNED_OUT') {
                setLoading(true)
                router.push(ROUTES.login)
                setTimeout(() => setLoading(false), 600)
            }
        })

        return () => subscription.unsubscribe()
    }, [pathname, router, supabase.auth])

    if (!loading) return null

    return <LoadingOverlay />
}