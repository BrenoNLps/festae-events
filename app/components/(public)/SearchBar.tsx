import { Search } from 'lucide-react'

export default function SearchBar() {
    return (
        <div className="w-full py-14">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Buscar evento, cidade, artista..." className="flex-1 outline-none text-gray-700 bg-transparent text-sm" />
                <button className="bg-purple-600 text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition">Buscar</button>
            </div>
        </div>
    )
}