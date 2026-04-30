import { createClient } from './client'

let instance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
    if (!instance) {
        instance = createClient()
    }
    return instance
}