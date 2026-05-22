'use client'
import Image from "next/image";
import { FcGoogle } from 'react-icons/fc'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'


export default function Login() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const router = useRouter()

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
        <div className="w-full h-screen flex flex-col">
            <div className="px-6 py-3 border-b border-gray-100">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1 text-sm text-gray-900 hover:text-gray-600 transition w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row">
                <div className="w-full h-48 md:w-1/3 md:h-full bg-indigo-900 flex items-center justify-center shrink-0">
                    <Image src="/images/logo.png" alt="Festaê" width={400} height={400} className="h-36 md:h-auto w-auto" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bem vindo ao Festaê</h1>
                        <p className="text-purple-800 text-sm">Entre com sua conta Google para continuar</p>
                    </div>
                    <button className="flex items-center gap-3 border border-gray-300 rounded-full px-6 py-3 hover:bg-gray-50 transition" onClick={loginWithGoogle}>
                        <FcGoogle className="h-5 w-5" />
                        <span className="text-sm font-medium text-black">Entrar com Google</span>
                    </button>
                </div>
            </div>
        </div>
    )
}


//140D3F