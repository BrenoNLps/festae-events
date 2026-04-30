'use client'
import { useState } from 'react'
import ImageUpload from '@/app/components/(protected)/ImageUpload'
import FormField from '@/app/components/(protected)/FormField'
import AddressField from '@/app/components/(protected)/AddressField'

export default function Create() {
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
    const [endereco, setEndereco] = useState({
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
                <FormField label="Nome" name="nome" value={form.nome} onChange={handleChange} placeholder="Nome do evento" />
                <FormField label="Descrição" name="descricao" value={form.descricao} onChange={handleChange} placeholder="Descrição do evento" rows={4} />
                <AddressField onChange={(end) => setEndereco(end)} />
                <div className="flex gap-4">
                    <FormField label="Data início" name="data_inicio" type="date" value={form.data_inicio} onChange={handleChange} min={hoje} max="2099-12-31" />
                    <FormField label="Data fim" name="data_fim" type="date" value={form.data_fim} onChange={handleChange} min={form.data_inicio || hoje} max="2099-12-31" />
                </div>
                <div className="flex gap-4">
                    <FormField label="Hora início" name="hora_inicio" type="time" value={form.hora_inicio} onChange={handleChange} />
                    <FormField label="Hora fim" name="hora_fim" type="time" value={form.hora_fim} onChange={handleChange} />
                </div>
                <div className="flex gap-4">
                    <FormField label="Vagas" name="vagas" type="number" value={form.vagas} onChange={handleChange} placeholder="0" />
                    <FormField label="Valor (R$)" name="valor" type="number" value={form.valor} onChange={handleChange} placeholder="0.00" />
                </div>
                <button className="bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition mt-4">
                    Criar Evento
                </button>
            </div>
        </div>
    )
}