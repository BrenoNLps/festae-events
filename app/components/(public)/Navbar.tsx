import { User } from 'lucide-react'

export default function Navbar() {
    return (
        <nav className="h-20 w-full flex items-center justify-between px-8 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">🌐 Festaê</span>
            </div>

            <div className="flex items-center gap-3">
                <button className="bg-purple-600 text-white font-bold text-sm px-5 py-2 rounded-full hover:bg-purple-700 transition">
                    Login
                </button>
                <button className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition">
                    <User className="h-5 w-5" />
                </button>
            </div>
        </nav>
    )
}