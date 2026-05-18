'use client'
import { useState } from 'react'
import { LogOut, User, Menu, X, Ticket, Plus, Users, MessageCircle, Calendar } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROUTES } from '@/app/lib/routes'

const menuItems = [
    { label: 'Eventos', icon: Ticket, href: ROUTES.events },
    { label: 'Criar Evento', icon: Plus, href: ROUTES.eventsCreate },
    { label: 'Amigos', icon: Users, href: ROUTES.friends },
    { label: 'Mensagens', icon: MessageCircle, href: ROUTES.chat },
    { label: 'Agenda', icon: Calendar, href: ROUTES.agenda },
]

export default function Navbar() {
    const supabase = createClient()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push(ROUTES.home)
    }

    return (
        <>
            <nav className="h-16 w-full border-b border-gray-300 flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-xl font-bold text-purple-600">🌐 Festaê</span>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition">
                        <User className="h-5 w-5" />
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col py-6 px-4">
                        <button className="self-end mb-4 text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
                            <X className="h-5 w-5" />
                        </button>
                        <nav className="flex flex-col gap-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 transition"
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
