import { useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrentUser } from "../useCurrentUser"
import { ROUTES } from "../../routes"
import { completeProfile } from "../../services/database/userService"
import { uploadImage } from "../../services/storage/uploadService"
import { profileSchema, ProfileFormData } from "../../validation/profileSchema"
import { AccountType } from "../../types"

export function useCompleteProfile() {
    const { user, loading } = useCurrentUser()
    const router = useRouter()
    const imageFileRef = useRef<File | null>(null)

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: '',
            tipo_conta: AccountType.USUARIO,
            cnpj: '',
        }
    })

    async function onSubmit(data: ProfileFormData) {
        if (!user) return
        let imagem_url: string | undefined
        if (imageFileRef.current) {
            imagem_url = await uploadImage('avatars', user.id, imageFileRef.current) ?? undefined
        }
        const { error } = await completeProfile(user.id, { ...data, imagem_url })
        if (error) {
            form.setError('root', { message: 'Erro ao salvar perfil. Tente novamente.' })
            return
        }
        router.push(ROUTES.events)
    }

    return { form, onSubmit, loading, setImageFile: (file: File) => { imageFileRef.current = file } }
}