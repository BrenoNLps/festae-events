import { Ticket, Plus, Users, MessageCircle, Calendar } from 'lucide-react'
import { ROUTES } from './routes'

export const menuItems = [
    { label: 'Eventos', icon: Ticket, href: ROUTES.events },
    { label: 'Criar Evento', icon: Plus, href: ROUTES.eventsCreate },
    { label: 'Amigos', icon: Users, href: ROUTES.friends },
    { label: 'Mensagens', icon: MessageCircle, href: ROUTES.chat },
    { label: 'Agenda', icon: Calendar, href: ROUTES.agenda },
]
