'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface RegistrationQRModalProps {
    codigo: string
    open: boolean
    onClose: () => void
}

export function RegistrationQRModal({ codigo, open, onClose }: RegistrationQRModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    const url = typeof window !== 'undefined'
        ? `${window.location.origin}/verify/${codigo}`
        : `/verify/${codigo}`

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
                    <span className="text-sm font-semibold text-gray-500">Comprovante de inscrição</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4 px-5 pb-6 pt-2">
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <QRCodeSVG value={url} size={180} />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        Apresente este QR code na entrada do evento
                    </p>
                    <p className="text-xs font-mono text-gray-500 tracking-widest">{codigo}</p>
                </div>
            </div>
        </div>
    )
}
