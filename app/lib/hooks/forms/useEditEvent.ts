import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { getEventById, updateEvent } from "../../services/database/eventService"
import { uploadImage } from "../../services/storage/uploadService"
import { eventSchema, EventFormData } from "../../validation/eventSchema"
import { Evento } from "../../types"

export function useEditEvent(eventId: number) {
    const { user } = useCurrentUser()
    const router = useRouter()
    const [event, setEvent] = useState<Evento | null>(null)
    const [loadingEvent, setLoadingEvent] = useState(true)
    const [saving, setSaving] = useState(false)
    const coverFileRef = useRef<File | null>(null)

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
    })

    useEffect(() => {
        getEventById(eventId).then(({ data }) => {
            if (data) {
                form.reset({
                    nome: data.nome,
                    descricao: data.descricao ?? '',
                    vagas: data.vagas,
                    valor: data.valor,
                    data_inicio: data.data_inicio,
                    data_fim: data.data_fim,
                    hora_inicio: data.hora_inicio,
                    hora_fim: data.hora_fim,
                    endereco: data.endereco,
                })
            }
            setEvent(data)
            setLoadingEvent(false)
        })
    }, [eventId, form])

    async function onSubmit(data: EventFormData) {
        if (!user || !event) return
        setSaving(true)
        let imagem_url: string | undefined
        if (coverFileRef.current) {
            imagem_url = await uploadImage('event-covers', user.id, coverFileRef.current) ?? undefined
        }
        await updateEvent(event.id, { ...data, imagem_url })
        router.push(`/events/${event.id}`)
    }

    return {
        form,
        onSubmit,
        saving,
        loadingEvent,
        event,
        setCoverFile: (file: File) => { coverFileRef.current = file },
    }
}
