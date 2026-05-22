'use client'
import { useFormContext } from 'react-hook-form'
import { EventCategory, EVENT_CATEGORY_LABELS } from '@/app/lib/types'
import styles from '@/app/styles/fields.module.css'

export function CategorySelect() {
    const { register, formState: { errors } } = useFormContext()
    const error = errors.categoria as { message?: string } | undefined

    return (
        <div>
            <label className={styles.label}>Categoria</label>
            <select {...register('categoria')} className={styles.input}>
                <option value="">Selecione uma categoria</option>
                {Object.values(EventCategory).map((cat) => (
                    <option key={cat} value={cat}>{EVENT_CATEGORY_LABELS[cat]}</option>
                ))}
            </select>
            {error && <span className={styles.error}>{error.message}</span>}
        </div>
    )
}
