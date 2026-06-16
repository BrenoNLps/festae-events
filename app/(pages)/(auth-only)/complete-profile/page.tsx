'use client'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import styles from '@/app/styles/fields.module.css'
import { useCompleteProfile } from '@/app/lib/hooks/forms/useCompleteProfile'
import { AccountType } from '@/app/lib/types'
import { maskCNPJ } from '@/app/lib/validators'

export default function CompleteProfile() {
    const { form, onSubmit, loading, setImageFile } = useCompleteProfile()
    const { register, handleSubmit, formState: { errors }, watch, setValue } = form
    const tipo = watch('tipo_conta')

    return (
        <div className={`${styles.formWrapper} max-w-md`}>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Complete seu perfil</h1>
            <p className="text-gray-500 text-sm mb-8">Essas informações serão visíveis para outros usuários</p>
            <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} gap-6`}>
                <ImageUpload onChange={setImageFile} shape="circle" />
                <div>
                    <label className={styles.label}>
                        Username
                    </label>
                    <input {...register('username')} className={styles.input} placeholder="@seu_username" />
                    {errors.username && <span className={styles.error}>{errors.username.message}</span>}
                </div>
                <div>
                    <label className={styles.label}>
                        Tipo de conta
                    </label>
                    <div className="flex gap-4 mt-2">
                        <button type="button" onClick={() => setValue('tipo_conta', AccountType.USUARIO)}
                            className={`${styles.accountTypeButton} ${tipo === AccountType.USUARIO ? styles.accountTypeButtonActive : styles.accountTypeButtonInactive}`}>
                            Usuário
                        </button>
                        <button type="button" onClick={() => setValue('tipo_conta', AccountType.EMPRESA)}
                            className={`${styles.accountTypeButton} ${tipo === AccountType.EMPRESA ? styles.accountTypeButtonActive : styles.accountTypeButtonInactive}`}>
                            Empresa
                        </button>
                    </div>
                </div>
                {tipo === AccountType.EMPRESA && (
                    <div>
                        <label className={styles.label}>
                            CNPJ
                        </label>
                        <input className={styles.input} inputMode="numeric" placeholder="00.000.000/0000-00" value={maskCNPJ(watch('cnpj') ?? '')}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 14)
                                setValue('cnpj', digits, { shouldValidate: digits.length === 14 })
                            }}
                        />
                        {errors.cnpj && <span className={styles.error}>{errors.cnpj.message}</span>}
                    </div>
                )}
                <button className={styles.submitButton} type="submit" disabled={loading}>
                    Salvar e continuar
                </button>
            </form>
        </div>
    )
}