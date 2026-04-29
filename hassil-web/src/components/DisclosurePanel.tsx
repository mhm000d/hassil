import type { ReactNode } from 'react'

export default function DisclosurePanel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <details className="disclosure-panel">
            <summary>{title}</summary>
            <div className="disclosure-content">{children}</div>
        </details>
    )
}
