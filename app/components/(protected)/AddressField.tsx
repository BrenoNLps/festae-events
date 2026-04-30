'use client'
import { useState } from "react"
import FormField from "./FormField"

interface AddressFieldProps {
    onChange: (endereco: {
        cep: string
        logradouro: string
        bairro: string
        cidade: string
        estado: string
        numero: string
    }) => void
}

export default function AddressField({ onChange }: AddressFieldProps) {
    const [endereco, setEndereco] = useState({
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
    })

    async function buscarCep(cep: string) {
        if (cep.length === 8) {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()
            if (!data.erro) {
                const novoEndereco = {
                    ...endereco,
                    cep,
                    logradouro: data.logradouro,
                    bairro: data.bairro,
                    cidade: data.localidade,
                    estado: data.uf,
                }
                setEndereco(novoEndereco)
                onChange(novoEndereco)
            }
        }
    }

    function handleCepChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const valor = e.target.value.replace(/\D/g, '').slice(0, 8)
        const novoEndereco = { ...endereco, cep: valor }
        setEndereco(novoEndereco)
        onChange(novoEndereco)
        buscarCep(valor)
    }

    function handleNumeroChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const novoEndereco = { ...endereco, numero: e.target.value }
        setEndereco(novoEndereco)
        onChange(novoEndereco)
    }

    return (
        <div className="flex flex-col gap-4">
            <FormField label="CEP" name="cep" value={endereco.cep} onChange={handleCepChange} placeholder="00000000" />
            <FormField label="Logradouro" name="logradouro" value={endereco.logradouro} onChange={() => {}} placeholder="Preenchido automaticamente" readOnly />
            <div className="flex gap-4">
                <FormField label="Número" name="numero" value={endereco.numero} onChange={handleNumeroChange} placeholder="000" />
                <FormField label="Bairro" name="bairro" value={endereco.bairro} onChange={() => {}} placeholder="Preenchido automaticamente" readOnly />
            </div>
            <div className="flex gap-4">
                <FormField label="Cidade" name="cidade" value={endereco.cidade} onChange={() => {}} placeholder="Preenchido automaticamente" readOnly />
                <FormField label="Estado" name="estado" value={endereco.estado} onChange={() => {}} placeholder="Preenchido automaticamente" readOnly />
            </div>
        </div>
    )
}