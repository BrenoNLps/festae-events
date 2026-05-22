'use client'
import { use } from 'react'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import AddressField from '@/app/components/(protected)/AddressField'
import styles from '@/app/styles/fields.module.css'
import { useEditEvent } from '@/app/lib/hooks/forms/useEditEvent'
import { maskCurrency, parseCurrency } from '@/app/lib/validators'
import { EventCategory, EVENT_CATEGORY_LABELS } from '@/app/lib/types'

export default function EditEvent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { form, onSubmit, saving, loadingEvent, event, minVagas, setCoverFile } = useEditEvent(Number(id))
    const { register, handleSubmit, formState: { errors }, setValue, watch } = form

    const hoje = new Date().toISOString().split('T')[0]
    const dataInicio = watch('data_inicio')

    if (loadingEvent) {
        return (
            <div className="animate-pulse flex flex-col gap-4 max-w-2xl mx-auto py-10">
                <div className="h-8 bg-gray-100 rounded w-1/3" />
                <div className="h-48 bg-gray-100 rounded-xl" />
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
            </div>
        )
    }

    if (!event) return <div className="text-center text-gray-400 py-20">Evento não encontrado.</div>

    return (
        <div className={`${styles.formWrapper} max-w-2xl`}>
            <h1 className="text-3xl font-bold mb-8 text-purple-800">Editar Evento</h1>
            <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} gap-4`}>
                <ImageUpload onChange={setCoverFile} />
                <div>
                    <label className={styles.label}>Nome</label>
                    <input {...register('nome')} className={styles.input} placeholder="Nome do evento" />
                    {errors.nome && <span className={styles.error}>{errors.nome.message}</span>}
                </div>
                <div>
                    <label className={styles.label}>Categoria</label>
                    <select {...register('categoria')} className={styles.input}>
                        <option value="">Selecione uma categoria</option>
                        {Object.values(EventCategory).map((cat) => (
                            <option key={cat} value={cat}>{EVENT_CATEGORY_LABELS[cat]}</option>
                        ))}
                    </select>
                    {errors.categoria && <span className={styles.error}>{errors.categoria.message}</span>}
                </div>
                <div>
                    <label className={styles.label}>Descrição</label>
                    <textarea {...register('descricao')} className={styles.input} placeholder="Descrição do evento" rows={4} />
                </div>
                <AddressField
                    initialValue={event.endereco}
                    onChange={(endereco) => setValue('endereco', endereco, { shouldValidate: true })}
                />
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
                        <input {...register('vagas', { valueAsNumber: true })} type="number" className={styles.input} placeholder="0" min={minVagas} />
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
                <button className={`${styles.submitButton} mt-4`} type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
            </form>
        </div>
    )
}
