import {
    deleteEventImage,
    uploadGroupImage,
    uploadImage,
} from '@/app/lib/services/storage/uploadService'

jest.mock('@/app/lib/supabase/singleton', () => {
    const bucket = {
        list: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
    }
    const storage = { from: jest.fn().mockReturnValue(bucket) }
    const client = { storage }
    return { getSupabaseClient: jest.fn(() => client), __mockClient: client, __mockBucket: bucket }
})

const { __mockClient: mockClient, __mockBucket: mockBucket } =
    jest.requireMock('@/app/lib/supabase/singleton')
const mockStorageFrom = mockClient.storage.from as jest.Mock

function makeFile(name = 'image.jpg'): File {
    return new File(['content'], name, { type: 'image/jpeg' })
}

beforeEach(() => {
    jest.resetAllMocks()
    mockStorageFrom.mockReturnValue(mockBucket)
})

describe('deleteEventImage', () => {
    // Happy path: lista e remove arquivos da pasta do evento
    it('lista arquivos da pasta e os remove', async () => {
        mockBucket.list.mockResolvedValueOnce({
            data: [{ name: 'image.jpg' }, { name: 'thumb.jpg' }],
        })
        mockBucket.remove.mockResolvedValueOnce({ data: null, error: null })

        await deleteEventImage('user-1', 42)

        expect(mockStorageFrom).toHaveBeenCalledWith('event-covers')
        expect(mockBucket.list).toHaveBeenCalledWith('user-1/42')
        expect(mockBucket.remove).toHaveBeenCalledWith([
            'user-1/42/image.jpg',
            'user-1/42/thumb.jpg',
        ])
    })

    // Edge case: não há arquivos → não deve chamar remove
    it('não chama remove quando não há arquivos', async () => {
        mockBucket.list.mockResolvedValueOnce({ data: [] })

        await deleteEventImage('user-1', 42)

        expect(mockBucket.remove).not.toHaveBeenCalled()
    })

    // Edge case: list retorna null → não deve chamar remove
    it('não chama remove quando list retorna null', async () => {
        mockBucket.list.mockResolvedValueOnce({ data: null })

        await deleteEventImage('user-1', 42)

        expect(mockBucket.remove).not.toHaveBeenCalled()
    })
})

describe('uploadGroupImage', () => {
    // Happy path: faz upload e retorna URL pública com cache-buster
    it('faz upload e retorna URL pública com timestamp', async () => {
        const file = makeFile('foto.png')
        mockBucket.upload.mockResolvedValueOnce({ error: null })
        mockBucket.getPublicUrl.mockReturnValueOnce({
            data: { publicUrl: 'https://storage.example.com/avatars/groups/conv-1/image.png' },
        })

        const result = await uploadGroupImage('conv-1', file)

        expect(mockBucket.upload).toHaveBeenCalledWith(
            'groups/conv-1/image.png',
            file,
            { upsert: true }
        )
        expect(result).toMatch(/^https:\/\/storage\.example\.com.*\?t=\d+$/)
    })

    // Edge case: erro no upload → deve retornar null
    it('retorna null quando o upload falha', async () => {
        const file = makeFile()
        mockBucket.upload.mockResolvedValueOnce({ error: new Error('Upload failed') })

        const result = await uploadGroupImage('conv-1', file)

        expect(result).toBeNull()
    })
})

describe('uploadImage', () => {
    // Happy path: upload de avatar de usuário (sem resourceId)
    it('faz upload de avatar sem resourceId e retorna URL pública', async () => {
        const file = makeFile('avatar.jpg')
        mockBucket.upload.mockResolvedValueOnce({ error: null })
        mockBucket.getPublicUrl.mockReturnValueOnce({
            data: { publicUrl: 'https://storage.example.com/avatars/users/user-1/image.jpg' },
        })

        const result = await uploadImage('avatars', 'user-1', file)

        expect(mockBucket.upload).toHaveBeenCalledWith(
            'users/user-1/image.jpg',
            file,
            { upsert: true }
        )
        expect(result).toMatch(/^https:\/\/.*\?t=\d+$/)
    })

    // Happy path: upload de capa de evento com resourceId
    it('faz upload de capa de evento com resourceId no path', async () => {
        const file = makeFile('cover.jpg')
        mockBucket.upload.mockResolvedValueOnce({ error: null })
        mockBucket.getPublicUrl.mockReturnValueOnce({
            data: { publicUrl: 'https://storage.example.com/event-covers/user-1/99/image.jpg' },
        })

        const result = await uploadImage('event-covers', 'user-1', file, 99)

        expect(mockBucket.upload).toHaveBeenCalledWith(
            'user-1/99/image.jpg',
            file,
            { upsert: true }
        )
        expect(result).toMatch(/^https:\/\/.*\?t=\d+$/)
    })

    // Edge case: erro no upload → deve retornar null
    it('retorna null quando o upload falha', async () => {
        const file = makeFile()
        mockBucket.upload.mockResolvedValueOnce({ error: new Error('Upload failed') })

        const result = await uploadImage('avatars', 'user-1', file)

        expect(result).toBeNull()
    })

    // Edge case: extensão extraída corretamente do nome do arquivo
    it('usa a extensão correta do arquivo no path', async () => {
        const file = makeFile('photo.webp')
        mockBucket.upload.mockResolvedValueOnce({ error: null })
        mockBucket.getPublicUrl.mockReturnValueOnce({
            data: { publicUrl: 'https://example.com/image.webp' },
        })

        await uploadImage('avatars', 'user-1', file)

        expect(mockBucket.upload).toHaveBeenCalledWith(
            'users/user-1/image.webp',
            file,
            expect.any(Object)
        )
    })
})
