import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { createEvent, updateEvent } from "../../services/database/eventService"
import { uploadImage } from "../../services/storage/uploadService"
import { eventSchema, EventFormData } from "../../validation/eventSchema"
import { getFriendIds } from "../../services/database/friendshipService"
import { insertNotificationsForFriends } from "../../services/database/notificationService"

export function useCreateEvent() {
    const { user, loading } = useCurrentUser()
    const router = useRouter()
    const coverFileRef = useRef<File | null>(null)
    const inFlight = useRef(false)

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
        if (!user || inFlight.current) return
        inFlight.current = true
        try {
            const { data: created, error } = await createEvent({ ...data, id_organizador: user.id })
            if (error || !created) return
            if (coverFileRef.current) {
                const imagem_url = await uploadImage('event-covers', user.id, coverFileRef.current, created.id) ?? undefined
                if (imagem_url) await updateEvent(created.id, { imagem_url })
            }
            const friendIds = await getFriendIds(user.id)
            await insertNotificationsForFriends(friendIds, 'evento')
            router.push(ROUTES.events)
        } finally {
            inFlight.current = false
        }
    }

    return { form, onSubmit, loading, setCoverFile: (file: File) => { coverFileRef.current = file } }
}