import '@testing-library/jest-dom'

// Variáveis de ambiente mínimas para o cliente Supabase inicializar sem erros nos testes
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// fetch não está disponível no jsdom por padrão — define um stub global
if (typeof global.fetch === 'undefined') {
    global.fetch = jest.fn() as unknown as typeof fetch
}
