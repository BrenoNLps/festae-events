import { useRouter } from "next/navigation"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { completeProfile } from "../../services/database/userService"
import { AccountType } from "../../types"

export function useCompleteProfile() {
    const {user, loading} = useCurrentUser()
    const router = useRouter()

    async function handleSubmit(data: {
        username: string
        tipo_conta: AccountType
        cnpj?: string
    }) {
        if (loading || !user) return
        const { error } = await completeProfile(user.id, data)
        if (!error) router.push(ROUTES.events)
    }

    return { handleSubmit, loading }
}