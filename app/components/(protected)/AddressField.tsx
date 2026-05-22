'use client'
import { useState } from "react"
import styles from '@/app/styles/fields.module.css'
import { getCepData } from '@/app/lib/services/api/cepService'
import type { Address } from '@/app/lib/types'

interface AddressFieldProps {
    onChange: (endereco: Address) => void
    initialValue?: Address
}

export default function AddressField({ onChange, initialValue }: AddressFieldProps) {
    const [endereco, setEndereco] = useState<Address>(initialValue ?? {
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
    })

    async function buscarCep(cep: string) {
        if (cep.length === 8) {
            const data = await getCepData(cep);
            if (data && !data.erro) {
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
            <div>
                <label className={styles.label}>CEP</label>
                <input name="cep" value={endereco.cep} onChange={handleCepChange} className={styles.input} placeholder="00000000" />
            </div>
            <div>
                <label className={styles.label}>Logradouro</label>
                <input name="logradouro" value={endereco.logradouro} className={styles.inputReadonly} placeholder="Preenchido automaticamente" readOnly />
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className={styles.label}>Número</label>
                    <input name="numero" value={endereco.numero} onChange={handleNumeroChange} className={styles.input} placeholder="000" />
                </div>
                <div className="flex-1">
                    <label className={styles.label}>Bairro</label>
                    <input name="bairro" value={endereco.bairro} className={styles.inputReadonly} placeholder="Preenchido automaticamente" readOnly />
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className={styles.label}>Cidade</label>
                    <input name="cidade" value={endereco.cidade} className={styles.inputReadonly} placeholder="Preenchido automaticamente" readOnly />
                </div>
                <div className="flex-1">
                    <label className={styles.label}>Estado</label>
                    <input name="estado" value={endereco.estado} className={styles.inputReadonly} placeholder="Preenchido automaticamente" readOnly />
                </div>
            </div>
        </div>
    )
}