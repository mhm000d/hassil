import type { ReactNode } from 'react'

export default function EmptyPanel({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <div className="empty-panel">
            <h3>{title}</h3>
            <p>{description}</p>
            {action}
        </div>
    )
}
