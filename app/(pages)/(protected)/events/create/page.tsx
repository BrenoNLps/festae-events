'use client'
import { useState } from 'react'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import AddressField from '@/app/components/(protected)/AddressField'
import styles from '@/app/styles/fields.module.css'
import { useCreateEvent } from '@/app/lib/hooks/forms/useCreateEvent'

export default function Create() {
    const {handleSubmit, loading} = useCreateEvent()
    const [imagem, setImagem] = useState<File | null>(null)
    const [form, setForm] = useState({
        nome: '',
        descricao: '',
        vagas: '',
        valor: '',
        data_inicio: '',
        data_fim: '',
        hora_inicio: '',
        hora_fim: '',
    })
    const [adress, setAdress] = useState({
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
    })

    const hoje = new Date().toISOString().split('T')[0]

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8 text-purple-800">Criar Evento</h1>
            <div className="flex flex-col gap-4">
                <ImageUpload onChange={(file) => setImagem(file)} />
                <div>
                    <label className={styles.label}>Nome</label>
                    <input name="nome" value={form.nome} onChange={handleChange} className={styles.input} placeholder="Nome do evento" />
                </div>
                <div>
                    <label className={styles.label}>Descrição</label>
                    <textarea name="descricao" value={form.descricao} onChange={handleChange} className={styles.input} placeholder="Descrição do evento" rows={4} />
                </div>
                <AddressField onChange={(end) => setAdress(end)} />
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Data início</label>
                        <input name="data_inicio" type="date" value={form.data_inicio} onChange={handleChange} className={styles.input} min={hoje} max="2099-12-31" />
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Data fim</label>
                        <input name="data_fim" type="date" value={form.data_fim} onChange={handleChange} className={styles.input} min={form.data_inicio || hoje} max="2099-12-31" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Hora início</label>
                        <input name="hora_inicio" type="time" value={form.hora_inicio} onChange={handleChange} className={styles.input} />
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Hora fim</label>
                        <input name="hora_fim" type="time" value={form.hora_fim} onChange={handleChange} className={styles.input} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className={styles.label}>Vagas</label>
                        <input name="vagas" type="number" value={form.vagas} onChange={handleChange} className={styles.input} placeholder="0" />
                    </div>
                    <div className="flex-1">
                        <label className={styles.label}>Valor (R$)</label>
                        <input name="valor" type="number" value={form.valor} onChange={handleChange} className={styles.input} placeholder="0.00" />
                    </div>
                </div>
                <button disabled={loading} onClick={
                    () => handleSubmit(
                        {...form,vagas: Number(form.vagas),valor: Number(form.valor),endereco: adress}
                    )  
                } className="bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-900 transition mt-4">
                    Criar Evento
                </button>
            </div>
        </div>
    )
}