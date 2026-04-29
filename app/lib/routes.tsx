export const ROUTES = {
    home: '/',
    login: '/login',
    events: '/events',
    eventsCreate: '/events/create',
    friends: '/friends',
    chat: '/chat',
    agenda: '/agenda',
    profile: '/profile',
}

export const PROTECTED_ROUTES = [
    ROUTES.events,
    ROUTES.friends,
    ROUTES.chat,
    ROUTES.agenda,
    ROUTES.profile,
]

export const PUBLIC_ROUTES = [
    ROUTES.home,
    ROUTES.login,
]