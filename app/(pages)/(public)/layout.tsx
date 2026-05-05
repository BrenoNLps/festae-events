import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { ROUTES } from '@/app/lib/routes'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect(ROUTES.events)
    }

    return <>{children}</>
}
