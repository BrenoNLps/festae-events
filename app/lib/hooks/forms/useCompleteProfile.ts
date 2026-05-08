import { useRouter } from "next/navigation"
import { useForm, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { completeProfile } from "../../services/database/userService"
import { profileSchema, ProfileFormData } from "../../validation/profileSchema"
import { AccountType } from "../../types"

export function useCompleteProfile(): { form: UseFormReturn<ProfileFormData>; onSubmit: (data: ProfileFormData) => Promise<void>; loading: boolean } {
    const { user, loading } = useCurrentUser()
    const router = useRouter()

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
            tipo_conta: AccountType.USUARIO,
            cnpj: '',
        }
    })

    async function onSubmit(data: ProfileFormData) {
        if (!user) return
        const { error } = await completeProfile(user.id, data)
        if (!error) router.push(ROUTES.events)
    }

    return { form, onSubmit, loading }
}