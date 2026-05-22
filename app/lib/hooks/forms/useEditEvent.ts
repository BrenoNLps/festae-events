import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { getEventById, updateEvent } from "../../services/database/eventService"
import { getRegistrationCount } from "../../services/database/registrationService"
import { uploadImage } from "../../services/storage/uploadService"
import { eventSchema, EventFormData } from "../../validation/eventSchema"
import { Evento } from "../../types"
import { ROUTES } from "../../routes"

export function useEditEvent(eventId: number) {
    const { user } = useCurrentUser()
    const router = useRouter()
    const [event, setEvent] = useState<Evento | null>(null)
    const [loadingEvent, setLoadingEvent] = useState(true)
    const [saving, setSaving] = useState(false)
    const [minVagas, setMinVagas] = useState(1)
    const coverFileRef = useRef<File | null>(null)

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
    })

    useEffect(() => {
        Promise.all([
            getEventById(eventId),
            getRegistrationCount(eventId),
        ]).then(([{ data }, count]) => {
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
                    categoria: data.categoria,
                })
            }
            setEvent(data)
            setMinVagas(Math.max(1, count))
            setLoadingEvent(false)
        })
    }, [eventId, form])

    useEffect(() => {
        if (!loadingEvent && event && user && event.id_organizador !== user.id) {
            router.replace(ROUTES.events)
        }
    }, [loadingEvent, event, user, router])

    async function onSubmit(data: EventFormData) {
        if (!user || !event) return
        if (data.vagas < minVagas) {
            form.setError('vagas', { message: `Mínimo ${minVagas} vaga${minVagas > 1 ? 's' : ''} (${minVagas} inscritos)` })
            return
        }
        setSaving(true)
        try {
            let imagem_url: string | undefined
            if (coverFileRef.current) {
                imagem_url = await uploadImage('event-covers', user.id, coverFileRef.current) ?? undefined
            }
            const { error } = await updateEvent(event.id, { ...data, imagem_url })
            if (!error) router.push(ROUTES.eventDetail(event.id))
        } finally {
            setSaving(false)
        }
    }

    return {
        form,
        onSubmit,
        saving,
        loadingEvent,
        event,
        minVagas,
        setCoverFile: (file: File) => { coverFileRef.current = file },
    }
}
