import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/app/lib/supabase/server'
import { ROUTES } from '@/app/lib/routes'
import Navbar from "@/app/components/(protected)/Navbar"
import Sidebar from "@/app/components/(protected)/Sidebar"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(ROUTES.login)
    }

    const pathname = (await headers()).get('x-pathname') ?? ''
    if (pathname !== ROUTES.completeProfile) {
        const { data: usuario } = await supabase
            .from('usuario')
            .select('username')
            .eq('id', user!.id)
            .single()

        if (!usuario?.username) {
            redirect(ROUTES.completeProfile)
        }
    }

    return (
        <div className="w-full h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <div className="hidden md:block">
                    <Sidebar />
                </div>
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}