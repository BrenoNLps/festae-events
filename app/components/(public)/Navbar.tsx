import Link from 'next/link'
import Image from 'next/image'
import { ROUTES } from '@/app/lib/routes'

export default function Navbar() {
    return (
        <nav className="h-20 w-full flex items-center justify-between px-8 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <Image src="/images/logo.png" alt="Festaê" width={36} height={36} />
                <span className="text-2xl font-bold text-purple-600">Festaê</span>
            </div>

            <div className="flex items-center gap-3">
                <Link href={ROUTES.login}>
                    <button className="bg-purple-600 text-white font-bold text-sm px-5 py-2 rounded-full hover:bg-purple-700 transition">
                        Entrar
                    </button>
                </Link>
            </div>
        </nav>
    )
}