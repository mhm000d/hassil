import { useEffect, useState } from 'react'
import type { TrustScoreEvent, User } from '../types'
import { useAuth, useTransactions } from '../hooks'
import { TrustScoreService } from '../services'
import { formatDateTime, getTrustScoreColor } from '../utils/formatters'
import PageHeading from '../components/PageHeading'
import TransactionTimeline from '../components/TransactionTimeline'

function TrustBreakdown({
    user,
    currentScore,
    events,
}: {
    user: User
    currentScore: number
    events: TrustScoreEvent[]
}) {
    const positiveEvents = events.filter((event) => (event.delta ?? event.newScore - event.oldScore) > 0).length
    const negativeEvents = events.filter((event) => (event.delta ?? event.newScore - event.oldScore) < 0).length
    const accountAge = Math.max(1, Math.round((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    const rows: [string, string][] = [
        ['Current score', `${currentScore}/100`],
        ['Positive changes', `${positiveEvents} recorded`],
        ['Negative changes', `${negativeEvents} recorded`],
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
    const { user } = useAuth()
    const { transactions, loading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTransactions()
    const [trustEvents, setTrustEvents] = useState<TrustScoreEvent[]>([])
    const [currentScore, setCurrentScore] = useState(user?.trustScore ?? 0)
    const [trustLoading, setTrustLoading] = useState(true)
    const [trustError, setTrustError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        const loadTrustHistory = async () => {
            if (!user) {
                setTrustLoading(false)
                return
            }

            try {
                setTrustLoading(true)
                setTrustError(null)
                const history = await TrustScoreService.history()
                if (!active) return
                setCurrentScore(history.currentScore)
                setTrustEvents(history.events)
            } catch (err: any) {
                if (active) setTrustError(err.message || 'Failed to fetch trust score history')
            } finally {
                if (active) setTrustLoading(false)
            }
        }

        loadTrustHistory()

        return () => {
            active = false
        }
    }, [user])

    if (!user) {
        return (
            <div className="card">
                <h2 className="card-title">Loading ledger</h2>
                <p className="soft-text mt-8">Fetching your transactions and trust history.</p>
            </div>
        )
    }

    return (
        <>
            <PageHeading title="Ledger and trust history" description="Track funding, fees, repayments, buffer releases, and score changes." />
            <div className="grid-2 wide-left">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Transaction ledger</h2>
                        <div className="top-actions">
                            <span className="badge status-active">{transactions.length} records</span>
                            <button className="btn btn-secondary btn-sm" onClick={refetchTransactions} disabled={transactionsLoading}>
                                {transactionsLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>
                    {transactionsError && <p className="error-text mb-18">{transactionsError}</p>}
                    <TransactionTimeline transactions={transactions} />
                </div>
                <div className="card card-gold">
                    <div className="card-header">
                        <h2 className="card-title">Trust score events</h2>
                        <span className="badge status-active">{trustLoading ? 'Loading' : `${currentScore}/100`}</span>
                    </div>
                    <TrustBreakdown user={user} currentScore={currentScore} events={trustEvents} />
                    {trustError && <p className="error-text mt-16">{trustError}</p>}
                    <div className="timeline mt-16">
                        {!trustLoading && trustEvents.length === 0 && <p className="soft-text">No trust score events yet.</p>}
                        {trustEvents.map((event) => {
                            const delta = event.delta ?? event.newScore - event.oldScore
                            return (
                                <div className="timeline-item" key={event.id}>
                                    <span
                                        className="timeline-dot"
                                        style={{ background: getTrustScoreColor(event.newScore) }}
                                    />
                                    <div className="timeline-content">
                                        <div className="timeline-type">
                                            {event.oldScore} to {event.newScore} {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                                        </div>
                                        <div className="timeline-desc">{event.reason}</div>
                                        <div className="timeline-date">{formatDateTime(event.createdAt)}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
