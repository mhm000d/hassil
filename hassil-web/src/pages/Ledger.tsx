import { useEffect, useState } from 'react'
import type { TrustScoreEvent, User } from '../types'
import { useAuth, useTransactions } from '../hooks'
import { mockApi, mockUsers, formatDateTime, getTrustScoreColor } from '../data/mockApi'
import PageHeading from '../components/PageHeading'
import TransactionTimeline from '../components/TransactionTimeline'

function TrustBreakdown({ user }: { user: User }) {
    const repaid = 1
    const evidenceCoverage = 80
    const disputed = 0
    const accountAge = Math.max(1, Math.round((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    const rows: [string, string][] = [
        ['Repayment history', `${repaid} completed`],
        ['Evidence quality', `${evidenceCoverage}% coverage`],
        ['Disputes', `${disputed} recorded`],
        ['Account age', `${accountAge} days`],
    ]
    return (
        <div className="trust-breakdown mt-16">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                </div>
            ))}
        </div>
    )
}

export default function Ledger() {
    const { user: authUser } = useAuth()
    const { transactions } = useTransactions()
    const [trustEvents, setTrustEvents] = useState<TrustScoreEvent[]>([])
    const user = authUser || mockUsers[0]

    useEffect(() => {
        mockApi.listTrustScoreEvents(user.id).then((res) => setTrustEvents(res.data))
    }, [user.id])

    return (
        <>
            <PageHeading title="Ledger and trust history" description="Track funding, fees, repayments, buffer releases, and score changes." />
            <div className="grid-2 wide-left">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Transaction ledger</h2>
                        <span className="badge status-active">{transactions.length} records</span>
                    </div>
                    <TransactionTimeline transactions={transactions} />
                </div>
                <div className="card card-gold">
                    <h2 className="card-title">Trust score events</h2>
                    <TrustBreakdown user={user} />
                    <div className="timeline mt-16">
                        {trustEvents.length === 0 && <p className="soft-text">No trust score events yet.</p>}
                        {trustEvents.map((event) => (
                            <div className="timeline-item" key={event.id}>
                                <span
                                    className="timeline-dot"
                                    style={{ background: getTrustScoreColor(event.newScore) }}
                                />
                                <div className="timeline-content">
                                    <div className="timeline-type">
                                        {event.oldScore} → {event.newScore}
                                    </div>
                                    <div className="timeline-desc">{event.reason}</div>
                                    <div className="timeline-date">{formatDateTime(event.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
