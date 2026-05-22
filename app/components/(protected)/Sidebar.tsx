'use client'

import { Ticket, Plus, Users, MessageCircle, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/app/lib/hooks/useProfile'
import { useNotifications } from '@/app/lib/hooks/useNotifications'
import { Avatar } from './Avatar'
import { ROUTES } from '@/app/lib/routes'

const menuItems = [
    { label: 'Eventos', icon: Ticket, href: ROUTES.events },
    { label: 'Criar Evento', icon: Plus, href: ROUTES.eventsCreate },
    { label: 'Amigos', icon: Users, href: ROUTES.friends },
    { label: 'Mensagens', icon: MessageCircle, href: ROUTES.chat },
    { label: 'Agenda', icon: Calendar, href: ROUTES.agenda },
]

export default function Sidebar() {
    const { dbUser } = useProfile()
    const badges = useNotifications()
    const displayName = dbUser?.nome || dbUser?.username

    return (
        <aside className="w-64 h-full bg-gray-900 flex flex-col justify-between py-6 px-4">
            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const badge = badges[item.href] ?? 0
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
            <div className="border-t border-gray-700 pt-4">
                <Link href={ROUTES.profile} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition">
                    <Avatar nome={displayName} imagem_url={dbUser?.imagem_url} size={32} />
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-xs text-gray-500">Meu perfil</span>
                        <span className="text-sm text-gray-300 truncate">{displayName}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                </Link>
            </div>
        </aside>
    )
}
