import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { createEvent } from "../../services/database/eventService"
import { uploadImage } from "../../services/storage/uploadService"
import { eventSchema, EventFormData } from "../../validation/eventSchema"

export function useCreateEvent() {
    const { user, loading } = useCurrentUser()
    const router = useRouter()
    const coverFileRef = useRef<File | null>(null)

    const form = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            nome: '',
            descricao: '',
            data_inicio: '',
            data_fim: '',
            hora_inicio: '',
            hora_fim: '',
            valor: 0,
            endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
            categoria: undefined,
        }
    })

    async function onSubmit(data: EventFormData) {
        if (!user) return
        let imagem_url: string | undefined
        if (coverFileRef.current) {
            imagem_url = await uploadImage('event-covers', user.id, coverFileRef.current) ?? undefined
        }
        const { error } = await createEvent({ ...data, id_organizador: user.id, imagem_url })
        if (!error) router.push(ROUTES.events)
    }

    return { form, onSubmit, loading, setCoverFile: (file: File) => { coverFileRef.current = file } }
}