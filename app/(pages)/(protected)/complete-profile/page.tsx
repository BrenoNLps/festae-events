'use client'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import styles from '@/app/styles/fields.module.css'
import { useCompleteProfile } from '@/app/lib/hooks/forms/useCompleteProfile'
import { AccountType } from '@/app/lib/types'
import { maskCNPJ } from '@/app/lib/validators'

export default function CompleteProfile() {
    const { form, onSubmit, loading } = useCompleteProfile()
    const { register, handleSubmit, formState: { errors }, watch, setValue } = form
    const tipo = watch('tipo_conta')

    return (
        <div className="w-full max-w-md mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Complete seu perfil</h1>
            <p className="text-gray-500 text-sm mb-8">Essas informações serão visíveis para outros usuários</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <ImageUpload onChange={() => {}} shape="circle" />
                <div>
                    <label className={styles.label}>Username</label>
                    <input {...register('username')} className={styles.input} placeholder="@seu_username" />
                    {errors.username && <span className={styles.error}>{errors.username.message}</span>}
                </div>
                <div>
                    <label className={styles.label}>Tipo de conta</label>
                    <div className="flex gap-4 mt-2">
                        <button type="button" onClick={() => setValue('tipo_conta', AccountType.USUARIO)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${tipo === AccountType.USUARIO ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700'}`}
                        >
                            Usuário
                        </button>
                        <button type="button" onClick={() => setValue('tipo_conta', AccountType.EMPRESA)}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${tipo === AccountType.EMPRESA ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700'}`}
                        >
                            Empresa
                        </button>
                    </div>
                </div>
                {tipo === AccountType.EMPRESA && (
                    <div>
                        <label className={styles.label}>CNPJ</label>
                        <input
                            value={maskCNPJ(watch('cnpj') ?? '')}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 14)
                                setValue('cnpj', digits, { shouldValidate: digits.length === 14 })
                            }}
                            className={styles.input}
                            placeholder="00.000.000/0000-00"
                            inputMode="numeric"
                        />
                        {errors.cnpj && <span className={styles.error}>{errors.cnpj.message}</span>}
                    </div>
                )}
                <button
                    type="submit"
                    className="bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-900 transition disabled:opacity-50"
                    disabled={loading}
                >
                    Salvar e continuar
                </button>
            </form>
        </div>
    )
}