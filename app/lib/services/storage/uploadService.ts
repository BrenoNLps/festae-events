import { getSupabaseClient } from '../../supabase/singleton'

const supabase = getSupabaseClient()

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
