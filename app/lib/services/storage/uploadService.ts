import { getSupabaseClient } from '../../supabase/singleton'

const supabase = getSupabaseClient()

export async function uploadImage(
    bucket: 'avatars' | 'event-covers',
    userId: string,
    file: File
): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
