interface FormFieldProps {
    label: string
    name: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    placeholder?: string
    rows?: number
    className?: string
    readOnly?: boolean
    min?: string
    max?: string
}

export default function FormField({ label, name, type = 'text', value, onChange, placeholder, rows, className = '', readOnly = false, min, max }: FormFieldProps) {
    const inputClassName = `w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`
    return (
        <div className={`flex-1 ${className}`}>
            <label className="text-sm font-bold text-gray-900">{label}</label>
            {rows ? (
                <textarea name={name} value={value} onChange={onChange} className={inputClassName} placeholder={placeholder} rows={rows} readOnly={readOnly} />
            ) : (
                <input name={name} type={type} value={value} onChange={onChange} className={inputClassName} placeholder={placeholder} readOnly={readOnly} min={min} max={max} />
            )}
        </div>
    )
}