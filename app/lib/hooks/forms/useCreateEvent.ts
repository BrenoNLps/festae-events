import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { createEvent } from "../../services/database/eventService"
import { eventSchema, EventFormData } from "../../validation/eventSchema"

export function useCreateEvent() {
    const { user, loading } = useCurrentUser()
    const router = useRouter()

    const form = useForm<EventFormData>({
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
        }
    })

    async function onSubmit(data: EventFormData) {
        if (!user) return
        const { error } = await createEvent({ ...data, id_organizador: user.id })
        if (!error) router.push(ROUTES.events)
    }

    return { form, onSubmit, loading }
}