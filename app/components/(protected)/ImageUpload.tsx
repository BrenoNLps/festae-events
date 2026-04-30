'use client'
import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'

interface ImageUploadProps {
    onChange: (file: File) => void
    shape?: 'square' | 'circle'
    height?: string
}

export default function ImageUpload({ onChange, shape = 'square', height = 'h-48' }: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            const file = e.target.files[0]
            onChange(file)
            setPreview(URL.createObjectURL(file))
        }
    }

    const isCircle = shape === 'circle'

    return (
        <div className={`${isCircle ? 'flex items-center justify-center' : 'w-full'}`}>
            <div
                onClick={() => inputRef.current?.click()}
                className={`
                    border border-gray-300 border-dashed overflow-hidden cursor-pointer hover:opacity-90 transition relative
                    ${isCircle ? 'w-24 h-24 rounded-full' : `w-full ${height} rounded-lg mt-1`}
                `}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1">
                            <ImagePlus className="h-4 w-4 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
                        <ImagePlus className={`text-gray-400 ${isCircle ? 'h-6 w-6' : 'h-8 w-8'}`} />
                        {!isCircle && <span className="text-sm text-gray-500">Clique para escolher uma imagem</span>}
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    )
}