import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseConfig } from '@/app/lib/supabase/config'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next') ?? ''
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/events'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const userId = data.session?.user.id
      if (userId) {
        const { data: usuario } = await supabase
          .from('usuario')
          .select('username')
          .eq('id', userId)
          .single()

        if (!usuario?.username) {
          return NextResponse.redirect(new URL('/complete-profile', requestUrl.origin))
        }
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
