'use client'
import {LogOut, User } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROUTES } from '@/app/lib/routes'

export default function Navbar() {
const supabase = createClient()
const router = useRouter()

async function handleLogout() {
    await supabase.auth.signOut()
    router.push(ROUTES.home)
}

return (
        <nav className="h-16 w-full  border-b border-gray-300 flex items-center justify-between px-8">
        <span className="text-xl font-bold text-purple-600">🌐 Festaê</span>
        <div className="flex items-center gap-3">
            <Link href={"/profile"} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition">
                <User className="h-5 w-5" />
            </Link>
            <button onClick={handleLogout}className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition">
                <LogOut className="h-5 w-5" />
            </button>
        </div>
        </nav>
    )
}