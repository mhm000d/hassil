import type { DashboardTransaction } from '../types'

function formatCurrency(value: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

export default function TransactionTimeline({ transactions }: { transactions: DashboardTransaction[] }) {
    return (
        <div className="timeline">
            {transactions.map((tx) => (
                <div className="timeline-item" key={tx.id}>
                    <span className="timeline-dot" />
                    <div className="timeline-content">
                        <div className="timeline-type">{tx.type}</div>
                        <div className="timeline-desc">{tx.description}</div>
                        <div className="timeline-amount">{formatCurrency(tx.amount, 'USD')}</div>
                        <div className="timeline-date">{tx.date}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
