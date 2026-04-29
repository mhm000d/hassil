import type { ReactNode } from 'react'

export default function DetailGrid({ items }: { items: [string, ReactNode][] }) {
    return (
        <div className="detail-grid">
            {items.map(([label, value]) => (
                <div className="detail-item" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                </div>
            ))}
        </div>
    )
}
