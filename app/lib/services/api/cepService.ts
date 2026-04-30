export async function getCepData(cep: string) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()
    if (data.erro) return null
    return data
}