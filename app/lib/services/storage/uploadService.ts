import { getSupabaseClient } from '../../supabase/singleton'

const supabase = getSupabaseClient()

export async function deleteEventImage(userId: string, eventId: number) {
    const folder = `${userId}/${eventId}`
    const { data: files } = await supabase.storage.from('event-covers').list(folder)
    if (!files?.length) return
    const paths = files.map((f) => `${folder}/${f.name}`)
    await supabase.storage.from('event-covers').remove(paths)
}

export async function uploadGroupImage(id_conversa: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `groups/${id_conversa}/image.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return null
    const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(path).data
    return `${publicUrl}?t=${Date.now()}`
}

export async function uploadImage(
    bucket: 'avatars' | 'event-covers',
    userId: string,
    file: File,
    resourceId?: string | number
): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = resourceId
        ? `${userId}/${resourceId}/image.${ext}`
        : `${userId}/image.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null

    const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(path).data
    return `${publicUrl}?t=${Date.now()}`
}
