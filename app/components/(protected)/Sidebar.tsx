'use client'

import { Ticket, Plus, Users, MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/app/lib/hooks/useProfile'
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

    const displayName = dbUser?.nome || dbUser?.username

    return (
        <aside className="w-64 h-full bg-gray-900 flex flex-col justify-between py-6 px-4">
            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg px-3 py-2 transition"
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>
            <Link href={ROUTES.profile} className="flex items-center gap-3 px-3 hover:opacity-80 transition">
                <Avatar nome={displayName} imagem_url={dbUser?.imagem_url} size={32} />
                <span className="text-sm text-gray-300 truncate">{displayName}</span>
            </Link>
        </aside>
    )
}