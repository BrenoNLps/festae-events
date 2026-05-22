interface AvatarProps {
    nome?: string
    imagem_url?: string
    size?: number
    className?: string
}

export function Avatar({ nome, imagem_url, size = 40, className = '' }: AvatarProps) {
    const style = { width: size, height: size, minWidth: size }

    if (imagem_url) return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagem_url} alt={nome ?? 'avatar'} style={style} className={`rounded-full object-cover ${className}`}/>
    )

    const initials = (nome ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    return (
        <div
            style={style}
            className={`rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 ${className}`}
        >
            <span style={{ fontSize: size * 0.35 }}>{initials}</span>
        </div>
    )
}
