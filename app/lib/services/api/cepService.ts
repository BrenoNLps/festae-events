export async function getCepData(cep: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal })
        const data = await response.json()
        if (data.erro) return null
        return data
    } catch {
        return null
    } finally {
        clearTimeout(timeout)
    }
}