export const ROUTES = {
    home: '/',
    login: '/login',
    events: '/events',
    eventsCreate: '/events/create',
    eventDetail: (id: number) => `/events/${id}`,
    eventEdit: (id: number) => `/events/${id}/edit`,
    completeProfile: '/complete-profile',
    friends: '/friends',
    chat: '/chat',
    agenda: '/agenda',
    profile: '/profile',
    verify: (codigo: string) => `/verify/${codigo}`,
}

export const PROTECTED_ROUTES = [
    ROUTES.events,
    ROUTES.friends,
    ROUTES.chat,
    ROUTES.agenda,
    ROUTES.profile,
    ROUTES.completeProfile,
]

export const PUBLIC_ROUTES = [
    ROUTES.home,
    ROUTES.login,
]