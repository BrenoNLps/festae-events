'use client'
import { FormProvider } from 'react-hook-form'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import AddressField from '@/app/components/(protected)/AddressField'
import { CategorySelect } from '@/app/components/(protected)/CategorySelect'
import styles from '@/app/styles/fields.module.css'
import { useCreateEvent } from '@/app/lib/hooks/forms/useCreateEvent'
import { maskCurrency, parseCurrency } from '@/app/lib/validators'

export default function Create() {
    const { form, onSubmit, loading, setCoverFile } = useCreateEvent()
    const { register, handleSubmit, formState: { errors }, setValue, watch } = form

    const hoje = getTodayAsString()
    const dataInicio = watch('data_inicio')

    return (
        <div className={`${styles.formWrapper} max-w-2xl`}>
            <h1 className="text-3xl font-bold mb-8 text-purple-800">Criar Evento</h1>
            <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} gap-4`}>
                <ImageUpload onChange={setCoverFile} />
                <div>
                    <label className={styles.label}>Nome</label>
                    <input {...register('nome')} className={styles.input} placeholder="Nome do evento" />
                    {errors.nome && <span className={styles.error}>{errors.nome.message}</span>}
                </div>
                <CategorySelect />
                <div>
                    <label className={styles.label}>Descrição</label>
                    <textarea {...register('descricao')} className={styles.input} placeholder="Descrição do evento" rows={4} />
                </div>
                <AddressField onChange={(endereco) => setValue('endereco', endereco, { shouldValidate: true })} />
                {errors.endereco?.cep && <span className={styles.error}>{errors.endereco.cep.message}</span>}
                {errors.endereco?.numero && <span className={styles.error}>{errors.endereco.numero.message}</span>}
                {errors.endereco?.logradouro && <span className={styles.error}>CEP não encontrado</span>}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Data início</label>
                        <input {...register('data_inicio')} type="date" className={styles.input} min={hoje} max="2099-12-31" />
                        {errors.data_inicio && <span className={styles.error}>{errors.data_inicio.message}</span>}
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Data fim</label>
                        <input {...register('data_fim')} type="date" className={styles.input} min={dataInicio || hoje} max="2099-12-31" />
                        {errors.data_fim && <span className={styles.error}>{errors.data_fim.message}</span>}
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Hora início</label>
                        <input {...register('hora_inicio')} type="time" className={styles.input} />
                        {errors.hora_inicio && <span className={styles.error}>{errors.hora_inicio.message}</span>}
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Hora fim</label>
                        <input {...register('hora_fim')} type="time" className={styles.input} />
                        {errors.hora_fim && <span className={styles.error}>{errors.hora_fim.message}</span>}
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Vagas</label>
                        <input {...register('vagas', { valueAsNumber: true })} type="number" className={styles.input} placeholder="0" min={1} />
                        {errors.vagas && <span className={styles.error}>{errors.vagas.message}</span>}
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Valor (R$)</label>
                        <input className={styles.input} type="text" inputMode="numeric" placeholder="0,00"
                            value={(() => { const v = watch('valor'); return (!v || isNaN(v)) ? '' : maskCurrency(Math.round(v * 100).toString()) })()}
                            onChange={(e) => setValue('valor', parseCurrency(e.target.value), { shouldValidate: true })}
                        />
                        {errors.valor && <span className={styles.error}>{errors.valor.message}</span>}
                    </div>
                </div>
                <button className={`${styles.submitButton} mt-4`} type="submit" disabled={loading}>
                    Criar Evento
                </button>
            </form>
            </FormProvider>
        </div>
    )
}