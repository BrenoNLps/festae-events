'use client'
import { useEffect } from 'react'

interface ConfirmDialogProps {
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
            onClick={onCancel}
        >
            <div
                className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {description && (
                        <p className="text-sm text-gray-500">{description}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60 ${
                            destructive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-indigo-900 text-white hover:bg-indigo-800'
                        }`}
                    >
                        {loading ? 'Aguarde...' : confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
