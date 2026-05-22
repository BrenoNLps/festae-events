'use client'
import Image from "next/image";
import { FcGoogle } from 'react-icons/fc'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'


export default function Login() {
    const supabase = createClient()
    const searchParams = useSearchParams()

    async function loginWithGoogle() {
        const next = searchParams.get('callbackUrl') ?? '/events'
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${next}`
            }
        })
    }

    return (
        <div className="w-full h-screen flex">
            <div className="w-1/3 h-screen bg-indigo-900 flex items-center justify-center">
                <Image src="/images/logo.png" alt="Login Image" width={400} height={400} />
            </div>

            <div className="w-2/3 h-screen flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-gray-900">Bem vindo ao Festaê</h1>
                <p className="text-purple-800 text-sm">Entre com sua conta Google para continuar</p>
                <button className="flex items-center gap-3 border border-gray-300 rounded-full px-6 py-3 hover:bg-gray-50 transition" onClick={loginWithGoogle}>
                    <FcGoogle className="h-5 w-5" />
                    <span className="text-sm font-medium text-black">Entrar com Google</span>
                </button>
            </div>
        </div>
    )
}


//140D3F