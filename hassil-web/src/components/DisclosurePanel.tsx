import type { ReactNode } from 'react'

export default function DisclosurePanel({ title, children, noDivider }: { title: string; children: ReactNode; noDivider?: boolean }) {
    return (
        <details className={`disclosure-panel${noDivider ? ' no-divider' : ''}`}>
            <summary>{title}</summary>
            <div className="disclosure-content">{children}</div>
        </details>
    )
}
