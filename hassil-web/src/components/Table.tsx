import type { JSX, ReactNode } from 'react'
import EmptyPanel from './EmptyPanel'

export default function Table({
    headers,
    rows,
    emptyTitle = 'No records yet',
    emptyDescription = 'Records will appear here when available.',
    emptyAction,
}: {
    headers: string[]
    rows: Array<Array<string | number | JSX.Element>>
    emptyTitle?: string
    emptyDescription?: string
    emptyAction?: ReactNode
}) {
    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={headers.length}>
                                <EmptyPanel title={emptyTitle} description={emptyDescription} action={emptyAction} />
                            </td>
                        </tr>
                    ) : rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} data-label={headers[cellIndex]} className={cellIndex === 0 ? 'td-primary' : undefined}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
