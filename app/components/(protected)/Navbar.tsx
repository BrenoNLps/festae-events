'use client'
import { useState } from 'react'
import { LogOut, Menu, X, Ticket, Plus, Users, MessageCircle, Calendar, ChevronRight } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROUTES } from '@/app/lib/routes'
import { useNotifications } from '@/app/lib/hooks/useNotifications'
import { useProfile } from '@/app/lib/hooks/useProfile'
import { Avatar } from './Avatar'

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
    const badges = useNotifications()
    const { dbUser } = useProfile()
    const displayName = dbUser?.nome || dbUser?.username

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
                <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition">
                    <LogOut className="h-5 w-5" />
                </button>
            </nav>

            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64 bg-gray-900 flex flex-col py-6 px-4">
                        <button className="self-end mb-4 text-gray-400 hover:text-white" onClick={() => setOpen(false)}>
                            <X className="h-5 w-5" />
                        </button>
                        <nav className="flex flex-col gap-2 flex-1">
                            {menuItems.map((item) => {
                                const badge = badges[item.href] ?? 0
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 transition"
                                    >
                                        <div className="relative">
                                            <item.icon className="h-5 w-5" />
                                            {badge > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                                                    {badge > 9 ? '9+' : badge}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                        <div className="flex flex-col gap-2 border-t border-gray-700 pt-4 mt-4">
                            <Link
                                href={ROUTES.profile}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition"
                            >
                                <Avatar nome={displayName} imagem_url={dbUser?.imagem_url} size={32} />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xs text-gray-500">Meu perfil</span>
                                    <span className="text-sm text-gray-300 truncate">{displayName}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg px-3 py-2 transition"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="text-sm">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
