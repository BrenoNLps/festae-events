export async function getCidadesByEstado(estado: string): Promise<string[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
        const response = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`,
            { signal: controller.signal }
        )
        const data = await response.json()
        return (data as { nome: string }[]).map((m) => m.nome).sort()
    } catch {
        return []
    } finally {
        clearTimeout(timeout)
    }
}
