import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AiReviewSnapshot } from '../types'
import {
    formatCurrency,
    formatDate,
    getModelLabel,
    getNextSimulationLabel,
} from '../data/mockApi'

import { useAuth, useInvoices, useAdvances, useTransactions, useAdmin } from '../hooks'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import LifecycleStepper from '../components/LifecycleStepper'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

function StatCard({ tone, label, value, sub }: { tone: 'gold' | 'green' | 'amber'; label: string; value: string; sub?: string }) {
    const toneLabel = { gold: '01', green: '02', amber: '03' }[tone]
    return (
        <div className={`stat-card ${tone}`}>
            <div className={`stat-icon ${tone}`}>{toneLabel}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    )
}

function AiReviewCard({ snapshot }: { snapshot: AiReviewSnapshot }) {
    return (
        <div className="ai-review-card">
            <div className="ai-review-header">
                <span className="ai-badge">AI Review Assistant</span>
            </div>
            <h2 className="card-title">Recommended: {snapshot.recommendedAction}</h2>
            <p className="ai-review-summary">{snapshot.summary}</p>
            <div className="risk-flags">
                {snapshot.riskFlags.length === 0 ? (
                    <div className="risk-flag-item success">No extra risk flags</div>
                ) : (
                    snapshot.riskFlags.map((flag) => <div key={flag} className="risk-flag-item">{flag}</div>)
                )}
            </div>
        </div>
    )
}

function AiRecommendationCollapsible({ snapshot }: { snapshot: AiReviewSnapshot }) {
    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <h2 className="card-title">AI Recommendation</h2>
            <div className="mt-16"><AiReviewCard snapshot={snapshot} /></div>
        </div>
    )
}

export default function AdvanceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user: authUser } = useAuth()

    // Pull live data from context — updates automatically after simulations
    const { advances, refetch: refetchAdvances,
            simulateDisbursement, simulateClientPaymentDetected,
            simulateUserRepayment, simulateClientPaidHassil,
            simulateBufferRelease } = useAdvances()
    const { invoices, refetch: refetchInvoices } = useInvoices()
    const { refetch: refetchTransactions } = useTransactions()
    const { getAiSnapshot } = useAdmin()

    const [aiSnapshot, setAiSnapshot] = useState<AiReviewSnapshot | null>(null)
    const [simulating, setSimulating] = useState(false)
    const [loading, setLoading] = useState(true)

    // Derive advance and invoice directly from context arrays — no local copies needed
    const advance = advances.find((a) => a.id === id) ?? null
    const invoice = advance ? invoices.find((inv) => inv.id === advance.invoiceId) ?? null : null

    // Refresh all context data on mount so this page always shows fresh state
    useEffect(() => {
        setLoading(true)
        Promise.all([refetchAdvances(), refetchInvoices(), refetchTransactions()])
            .finally(() => setLoading(false))
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    // Load AI snapshot separately (fetched on demand, not stored in context)
    useEffect(() => {
        if (id) {
            getAiSnapshot(id).then((snap) => setAiSnapshot(snap ?? null))
        }
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    const simulate = async () => {
        if (!advance || !invoice || !authUser || simulating) return
        setSimulating(true)
        try {
            if (advance.status === 'Approved') {
                await simulateDisbursement(advance.id)
            } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'Disbursed') {
                await simulateClientPaidHassil(advance.id)
            } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'ClientPaidHassil') {
                await simulateBufferRelease(advance.id)
            } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'Disbursed') {
                await simulateClientPaymentDetected(advance.id)
            } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'ClientPaymentDetected') {
                await simulateUserRepayment(advance.id)
            }
            // Each simulate* call already refetches advances in AdvanceContext.
            // Refresh transactions so the timeline updates too.
            await refetchTransactions()
        } finally {
            setSimulating(false)
        }
    }

    if (loading) {
        return <div className="loading-state">Loading advance...</div>
    }

    if (!advance || !invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Advance not found</h2>
                <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>Back to invoices</button>
            </div>
        )
    }

    const nextLabel = getNextSimulationLabel(advance.status, advance.financingModel)

    // Factoring advance waiting for client — show the send/preview panel
    const awaitingClient = advance.status === 'PendingClientConfirmation' && !!invoice.clientConfirmation

    return (
        <>
            <Breadcrumbs
                items={[
                    { label: 'Invoices', onClick: () => navigate('/invoices') },
                    { label: invoice.invoiceNumber, onClick: () => navigate(`/invoices/${invoice.id}`) },
                    { label: 'Advance' },
                ]}
            />
            <PageHeading title="Advance" description={`${invoice.invoiceNumber} · ${getModelLabel(advance.financingModel)}`} />
            <LifecycleStepper status={advance.status} model={advance.financingModel} clientConfirmed={invoice.clientConfirmation?.status === 'Confirmed'} />
            <section className="stat-grid">
                <StatCard tone="gold" label="Invoice amount" value={formatCurrency(invoice.amount, invoice.currency)} sub={invoice.invoiceNumber} />
                <StatCard tone="green" label="Advance amount" value={formatCurrency(advance.advanceAmount, invoice.currency)} sub={`${Math.round(advance.requestedPercent * 100)}% requested`} />
                <StatCard tone="amber" label="Flat fee" value={formatCurrency(advance.feeAmount, invoice.currency)} sub={`${(advance.feeRate * 100).toFixed(1)}% fixed upfront`} />
            </section>
            <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.75fr)' }}>
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Repayment path</h2>
                            <ModelBadge model={advance.financingModel} />
                        </div>
                        <StatusBadge status={advance.status} />
                    </div>
                    <DetailGrid
                        items={[
                            ['Client', `${invoice.client.name} · ${invoice.client.email}`],
                            ['Due date', formatDate(invoice.dueDate)],
                            ['Repayment party', advance.repaymentParty === 'Client' ? 'Client pays Hassil' : 'User repays Hassil'],
                            ['Expected repayment', formatCurrency(advance.expectedRepaymentAmount, invoice.currency)],
                        ]}
                    />
                    <DisclosurePanel title="More advance details" noDivider>
                        <DetailGrid
                            items={[
                                ['Client notification', advance.clientNotificationRequired ? 'Required' : 'Not required'],
                                ['Settlement buffer', formatCurrency(advance.settlementBufferAmount, invoice.currency)],
                                ['Review score', `${advance.reviewScore}/100`],
                                ['Approval mode', advance.approvalMode ?? 'N/A'],
                            ]}
                        />
                    </DisclosurePanel>

                    {/* ── Action panel ── */}
                    <div className="disclosure-panel">
                        <h2 className="card-title">Next step</h2>
                        {awaitingClient && (
                            <div className="simulation-panel mt-16">
                                <div className="simulation-header">
                                    <Icon name="link" />
                                    <span>Send confirmation to client</span>
                                </div>
                                <p className="simulation-text">
                                    <strong>{invoice.client.name}</strong> ({invoice.client.email}) must confirm this invoice before the advance can be reviewed.
                                </p>
                                <button
                                    className="btn btn-sim"
                                    onClick={() => navigate(`/client/confirm/${invoice.clientConfirmation!.token}?from=${advance.id}`)}
                                >
                                    Simulate client action
                                </button>
                            </div>
                        )}
                        {!awaitingClient && nextLabel && (
                            <div className="simulation-panel mt-16">
                                <div className="simulation-header">
                                    <Icon name="settings" />
                                    <span>Lifecycle Simulator</span>
                                </div>
                                <p className="simulation-text">Trigger the next phase of the financing lifecycle to test state transitions and ledger entries.</p>
                                <button className="btn btn-sim" onClick={simulate} disabled={simulating}>
                                    {simulating ? 'Processing...' : nextLabel}
                                </button>
                            </div>
                        )}
                        {!awaitingClient && !nextLabel && (
                            (() => {
                                if (advance.status === 'Repaid' || advance.status === 'BufferReleased') {
                                    return (
                                        <div className="simulation-panel success mt-16">
                                            <Icon name="check" />
                                            <span>Lifecycle Completed</span>
                                        </div>
                                    )
                                }
                                const messages: Record<string, { icon: 'check' | 'settings' | 'review' | 'next'; title: string; body: string; disputed?: boolean }> = {
                                    PendingReview:         { icon: 'review',   title: 'Under review',                    body: 'Your advance request is being reviewed by the Hassil team.' },
                                    Approved:              { icon: 'next',     title: 'Approved — awaiting disbursement', body: 'The advance has been approved. Disbursement will be processed shortly.' },
                                    Disbursed:             { icon: 'check',    title: 'Advance funded',                   body: 'The advance has been sent to your bank account.' },
                                    ClientPaymentDetected: { icon: 'settings', title: 'Payment detected',                 body: 'Client payment has been detected. Repayment is being processed.' },
                                    ClientPaidHassil:      { icon: 'settings', title: 'Client paid Hassil',               body: 'Client payment received. Settlement buffer will be released shortly.' },
                                    Rejected:              { icon: 'review',   title: 'Advance rejected',                 body: advance.rejectionReason ?? 'The advance request was not approved.' },
                                    Disputed:              { icon: 'review',   title: 'Invoice disputed by client',       body: 'The client disputed this invoice. The advance has been cancelled. Resolve the dispute with your client and submit a new advance.', disputed: true },
                                }
                                const msg = messages[advance.status]
                                if (!msg) return <p className="soft-text mt-16">No next step available for this status.</p>
                                return (
                                    <div className={`simulation-panel mt-16${advance.status === 'Disbursed' ? ' success' : ''}`}>
                                        <div className="simulation-header">
                                            <Icon name={msg.icon} />
                                            <span>{msg.title}</span>
                                        </div>
                                        <p className="simulation-text">{msg.body}</p>
                                        {advance.status === 'Rejected' && (
                                            <button
                                                className="btn btn-primary full-width mt-8"
                                                onClick={() => navigate(`/invoices/${invoice.id}/advance`)}
                                            >
                                                <Icon name="advance" /> Request new advance
                                            </button>
                                        )}
                                    </div>
                                )
                            })()
                        )}
                    </div>
                </div>
                <div>
                    {aiSnapshot
                        ? <AiRecommendationCollapsible snapshot={aiSnapshot} />
                        : (
                            <div className="card" style={{ marginBottom: 24 }}>
                                <h2 className="card-title">AI Recommendation</h2>
                                <p className="soft-text mt-8">No AI review has been generated for this advance yet. The admin can trigger one during review.</p>
                            </div>
                        )
                    }
                </div>
            </div>
        </>
    )
}
