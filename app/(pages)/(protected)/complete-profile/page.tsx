'use client'
import { useState } from 'react'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import styles from '@/app/styles/fields.module.css'
import { useCompleteProfile } from '@/app/lib/hooks/forms/useCompleteProfile'
import { AccountType } from '@/app/lib/types'

export default function CompleteProfile() {
    const {handleSubmit, loading} = useCompleteProfile()
    const [tipo, setTipo] = useState<AccountType>(AccountType.USUARIO)
    const [form, setForm] = useState({ username: '', cnpj: '' })
    const [imagem, setImagem] = useState<File | null>(null)

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    return (
        <div className="w-full max-w-md mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Complete seu perfil</h1>
            <p className="text-gray-500 text-sm mb-8">Essas informações serão visíveis para outros usuários</p>
            <div className="flex flex-col gap-6">
                <ImageUpload onChange={(file) => setImagem(file)} shape="circle" />
                <div>
                    <label className={styles.label}>Username</label>
                    <input name="username" value={form.username} onChange={handleChange} className={styles.input} placeholder="@seu_username" />
                </div>
                <div>
                    <label className={styles.label}>Tipo de conta</label>
                    <div className="flex gap-4 mt-2">
                        <button type="button" onClick={() => setTipo(AccountType.USUARIO)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${tipo === AccountType.USUARIO ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700'}`}
                        >
                            Usuário
                        </button>
                        <button type="button" onClick={() => setTipo(AccountType.EMPRESA)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${tipo === AccountType.EMPRESA ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700'}`}
                        >
                            Empresa
                        </button>
                    </div>
                </div>
                {tipo === AccountType.EMPRESA && (
                    <div>
                        <label className={styles.label}>CNPJ</label>
                        <input name="cnpj" value={form.cnpj} onChange={handleChange} className={styles.input} placeholder="00.000.000/0000-00" maxLength={14} />
                    </div>
                )}
                <button 
                    className="bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-900 transition"
                    disabled={loading} 
                    onClick={
                        () => {
                            if (!form.username.trim()) return
                            if (tipo === AccountType.EMPRESA && !form.cnpj.trim()) return
                            handleSubmit({username: form.username, tipo_conta: tipo, cnpj: tipo === AccountType.EMPRESA ? form.cnpj : undefined})
                        }}
                >
                    Salvar e continuar
                </button>
            </div>
        </div>
    )
}