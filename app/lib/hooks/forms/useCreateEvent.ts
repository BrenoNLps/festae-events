import { useRouter } from "next/navigation";
import { useCurrentUser } from "../useCurrentUser";
import { ROUTES } from "../../routes";
import { createEvent } from "../../services/database/eventService";
import { Adress } from "../../types";

export function useCreateEvent() {
    const {user, loading} = useCurrentUser()
    const router = useRouter()

    async function handleSubmit(data: {
        nome: string; 
        descricao: string; 
        endereco: Adress;
        vagas: number; 
        valor: number
        data_inicio: string; 
        data_fim: string
        hora_inicio: string; 
        hora_fim: string
    }) {
        if (loading || !user) return
        const { error } = await createEvent({ ...data, id_organizador: user.id })
        if (!error) router.push(ROUTES.events)
    }

    return { handleSubmit, loading }
}