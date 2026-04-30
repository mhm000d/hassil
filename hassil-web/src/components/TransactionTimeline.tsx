import type { Transaction } from '../types'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import EmptyPanel from './EmptyPanel'

function transactionLabel(type: Transaction['type']): string {
    const map: Record<Transaction['type'], string> = {
        AdvanceDisbursement: 'Advance disbursement',
        DetectedIncomingPayment: 'Detected incoming payment',
        UserRepayment: 'User repayment',
        ClientPaymentToHassil: 'Client payment to Hassil',
        PlatformFee: 'Platform fee',
        BufferRelease: 'Buffer release',
        TrustScoreAdjustment: 'Trust score adjustment',
    }
    return map[type] ?? type
}

export default function TransactionTimeline({ transactions }: { transactions: Transaction[] }) {
    if (transactions.length === 0) {
        return <EmptyPanel title="No ledger activity yet" description="Funding, repayment, and score events will appear here." />
    }
    return (
        <div className="timeline">
            {transactions.map((tx) => (
                <div className="timeline-item" key={tx.id}>
                    <span
                        className="timeline-dot"
                        style={{
                            background:
                                tx.direction === 'Debit'
                                    ? 'var(--red)'
                                    : tx.direction === 'Credit'
                                      ? 'var(--teal)'
                                      : 'var(--amber)',
                        }}
                    />
                    <div className="timeline-content">
                        <div className="timeline-type">
                            {transactionLabel(tx.type)} · {tx.direction}
                            {tx.invoiceNumber && ` · ${tx.invoiceNumber}`}
                        </div>
                        <div className="timeline-desc">{tx.description}</div>
                        <div className="timeline-amount">
                            {tx.type === 'TrustScoreAdjustment'
                                ? `${tx.amount > 0 ? '+' : ''}${tx.amount} score`
                                : formatCurrency(tx.amount)}
                        </div>
                        <div className="timeline-date">{formatDateTime(tx.createdAt)}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}
