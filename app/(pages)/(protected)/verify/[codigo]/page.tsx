'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'
import { getRegistrationByCodigo } from '@/app/lib/services/database/registrationService'
import { Avatar } from '@/app/components/(protected)/Avatar'
import { formatDateRange } from '@/app/lib/utils/date'

type RegistrationInfo = {
    usuario: { id: string; username: string; nome: string | null; imagem_url: string | null }
    evento: { id: number; nome: string; data_inicio: string }
}

export default function VerifyPage() {
    const { codigo } = useParams<{ codigo: string }>()
    const [info, setInfo] = useState<RegistrationInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        getRegistrationByCodigo(codigo).then(({ data, error }) => {
            if (error || !data) {
                setNotFound(true)
            } else {
                setInfo(data as unknown as RegistrationInfo)
            }
            setLoading(false)
        })
    }, [codigo])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
        )
    }

    if (notFound || !info) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <XCircle className="h-16 w-16 text-red-400" />
                <p className="text-lg font-semibold text-gray-700">Inscrição não encontrada</p>
                <p className="text-sm text-gray-400">Este código é inválido ou foi cancelado.</p>
            </div>
        )
    }

    const displayName = info.usuario.nome || info.usuario.username

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1.5">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="text-base font-bold text-gray-900">Inscrição confirmada</p>
                </div>

                <hr className="w-full border-gray-100" />

                <div className="flex flex-col items-center gap-2">
                    <Avatar nome={displayName} imagem_url={info.usuario.imagem_url ?? undefined} size={64} />
                    <div className="text-center">
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-400">@{info.usuario.username}</p>
                    </div>
                </div>

                <hr className="w-full border-gray-100" />

                <div className="w-full flex flex-col gap-1 text-center">
                    <p className="text-sm font-medium text-gray-700">{info.evento.nome}</p>
                    <p className="text-xs text-gray-400">{formatDateRange(info.evento.data_inicio, info.evento.data_inicio)}</p>
                </div>

                <p className="text-xs font-mono text-gray-300 tracking-widest">{codigo}</p>
            </div>
        </div>
    )
}
