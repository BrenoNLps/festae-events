import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

import { PROTECTED_ROUTES, PUBLIC_ROUTES, ROUTES } from './app/lib/routes'

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicOnlyRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname === route)
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
        cookies: {
            getAll() {
            return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
            )
            },
        },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    const { pathname } = request.nextUrl

    if (session && isPublicOnlyRoute(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = ROUTES.events
        return NextResponse.redirect(url)
    }

    if (!session && isProtectedRoute(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = ROUTES.login
        return NextResponse.redirect(url)
    }

    //Impede que o bfcache forneça informações de autenticação desatualizadas ao navegar (de trás/para frente).
    supabaseResponse.headers.set('Cache-Control', 'no-store')

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}