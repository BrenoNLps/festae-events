'use client'
import { useEffect } from 'react'
import { BadgeCheck, X } from 'lucide-react'
import { AccountType, Usuario } from '@/app/lib/types'
import { Avatar } from '@/app/components/(protected)/Avatar'
import { maskCNPJ } from '@/app/lib/validators'

interface UserProfileSheetProps {
    user: Usuario | null
    open: boolean
    onClose: () => void
}

export function UserProfileSheet({ user, open, onClose }: UserProfileSheetProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open || !user) return null

    const isEmpresa = user.tipo_conta === AccountType.EMPRESA
    const displayName = user.nome || user.username

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <span className="text-sm font-semibold text-gray-500">Organizador</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-3 px-5 pb-6 pt-2">
                    <Avatar nome={displayName} imagem_url={user.imagem_url} size={72} />

                    <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-gray-900">{displayName}</span>
                            {isEmpresa && (
                                <BadgeCheck className="h-5 w-5 text-purple-500 shrink-0" title="Empresa verificada" />
                            )}
                        </div>
                        <span className="text-sm text-gray-400">@{user.username}</span>
                    </div>

                    {isEmpresa && user.cnpj && (
                        <div className="w-full bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">CNPJ</span>
                            <span className="text-sm text-gray-700 font-mono">{maskCNPJ(user.cnpj)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
