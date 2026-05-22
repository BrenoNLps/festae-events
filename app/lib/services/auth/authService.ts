import { getSupabaseClient } from '../../supabase/singleton'

const supabase = getSupabaseClient()

export async function signInWithGoogle(redirectTo: string) {
    return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    })
}

export async function signOut() {
    return supabase.auth.signOut()
}

export async function getSession() {
    return supabase.auth.getSession()
}

export async function getUser() {
    return supabase.auth.getUser()
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback)
}
