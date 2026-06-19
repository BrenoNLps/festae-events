'use client'
import { useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useProfile } from '@/app/lib/hooks/useProfile'
import { AccountType } from '@/app/lib/types'
import { maskCNPJ } from '@/app/lib/validators'
import { updateProfile } from '@/app/lib/services/database/userService'
import { uploadImage } from '@/app/lib/services/storage/uploadService'
import { Avatar } from '@/app/components/(protected)/Avatar'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import styles from '@/app/styles/fields.module.css'

export default function Profile() {
    const { user, dbUser, loading, refresh } = useProfile()
    const [editing, setEditing] = useState(false)
    const [nome, setNome] = useState('')
    const [username, setUsername] = useState('')
    const [saving, setSaving] = useState(false)
    const imageFileRef = useRef<File | null>(null)

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
    )

    if (!dbUser || !user) return null

    function startEditing() {
        setNome(dbUser!.nome ?? '')
        setUsername(dbUser!.username)
        setEditing(true)
    }

    async function save() {
        if (!user) return
        setSaving(true)
        let imagem_url: string | undefined
        if (imageFileRef.current) {
            imagem_url = await uploadImage('avatars', user.id, imageFileRef.current) ?? undefined
        }
        await updateProfile(user.id, { nome, username, imagem_url })
        await refresh()
        setSaving(false)
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="max-w-lg mx-auto py-10 flex flex-col gap-6">
                <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </button>

                <div className="flex items-center gap-4">
                    <ImageUpload onChange={(file) => { imageFileRef.current = file }} shape="circle" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Editar perfil</h2>
                        <p className="text-sm text-gray-500">@{dbUser.username}</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                    <div>
                        <label className={styles.label}>Nome</label>
                        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
                    </div>
                    <div>
                        <label className={styles.label}>Apelido</label>
                        <input className={styles.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="@seu_apelido" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setEditing(false)} className="text-sm font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
                            Cancelar
                        </button>
                        <button onClick={save} disabled={saving} className={styles.submitButton}>
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto py-10 flex flex-col gap-6">
            <div className="flex items-center gap-5">
                <Avatar nome={dbUser.nome ?? dbUser.username} imagem_url={dbUser.imagem_url} size={80} className="shrink-0" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{dbUser.nome || dbUser.username}</h1>
                    <p className="text-sm text-gray-500">@{dbUser.username}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${dbUser.tipo_conta === AccountType.EMPRESA ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {dbUser.tipo_conta === AccountType.EMPRESA ? 'Empresa' : 'Usuário'}
                    </span>
                </div>
                <button onClick={startEditing} className="text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition shrink-0">
                    Editar
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                <div className="flex justify-between items-center px-5 py-4">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
                {dbUser.cnpj && (
                    <div className="flex justify-between items-center px-5 py-4">
                        <span className="text-sm text-gray-500">CNPJ</span>
                        <span className="text-sm font-medium text-gray-900">{maskCNPJ(dbUser.cnpj)}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
