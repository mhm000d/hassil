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
import TransactionTimeline from '../components/TransactionTimeline'
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
    const statusMap = { Low: 'Approved', Medium: 'PendingReview', High: 'Rejected' } as const
    return (
        <div className="ai-review-card">
            <div className="ai-review-header">
                <span className="ai-badge">AI Review Assistant</span>
                <StatusBadge status={statusMap[snapshot.riskLevel]} />
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
    const { transactions, refetch: refetchTransactions } = useTransactions()
    const { getAiSnapshot } = useAdmin()

    const [aiSnapshot, setAiSnapshot] = useState<AiReviewSnapshot | null>(null)
    const [simulating, setSimulating] = useState(false)

    // Derive advance and invoice directly from context arrays — no local copies needed
    const advance = advances.find((a) => a.id === id) ?? null
    const invoice = advance ? invoices.find((inv) => inv.id === advance.invoiceId) ?? null : null
    const advanceTransactions = transactions.filter((tx) => tx.advanceRequestId === id)

    // Refresh all context data on mount so this page always shows fresh state
    useEffect(() => {
        refetchAdvances()
        refetchInvoices()
        refetchTransactions()
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

    if (!advance || !invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Fetching Advance Details...</h2>
            </div>
        )
    }

    const nextLabel = getNextSimulationLabel(advance.status, advance.financingModel)
    const confirmationToken = invoice.clientConfirmation?.token

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
            <LifecycleStepper status={advance.status} model={advance.financingModel} />
            <section className="stat-grid">
                <StatCard tone="gold" label="Invoice amount" value={formatCurrency(invoice.amount, invoice.currency)} sub={invoice.invoiceNumber} />
                <StatCard tone="green" label="Advance amount" value={formatCurrency(advance.advanceAmount, invoice.currency)} sub={`${Math.round(advance.requestedPercent * 100)}% requested`} />
                <StatCard tone="amber" label="Flat fee" value={formatCurrency(advance.feeAmount, invoice.currency)} sub={`${(advance.feeRate * 100).toFixed(1)}% fixed upfront`} />
            </section>
            <div className="grid-2 wide-left">
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
                    <DisclosurePanel title="More advance details">
                        <DetailGrid
                            items={[
                                ['Client notification', advance.clientNotificationRequired ? 'Required' : 'Not required'],
                                ['Settlement buffer', formatCurrency(advance.settlementBufferAmount, invoice.currency)],
                                ['Review score', `${advance.reviewScore}/100`],
                                ['Approval mode', advance.approvalMode ?? 'N/A'],
                            ]}
                        />
                    </DisclosurePanel>
                    {confirmationToken && advance.status === 'PendingClientConfirmation' && (
                        <div className="quote-disclaimer mt-16">
                            Client confirmation is required before funding.
                            <button
                                className="btn btn-secondary btn-sm ml-auto"
                                onClick={() => navigate(`/client/confirm/${confirmationToken}`)}
                            >
                                <Icon name="open" /> Open Client Link
                            </button>
                        </div>
                    )}
                    {nextLabel ? (
                        <div className="simulation-panel mt-16">
                            <div className="simulation-header">
                                <Icon name="settings" />
                                <span>Lifecycle Simulator</span>
                            </div>
                            <p className="simulation-text">Trigger the next phase of the financing lifecycle to test state transitions and ledger entries.</p>
                            <button className="btn btn-sim full-width" onClick={simulate} disabled={simulating}>
                                <Icon name="next" /> {simulating ? 'Processing...' : nextLabel}
                            </button>
                        </div>
                    ) : (
                        advance.status === 'Repaid' ? (
                            <div className="simulation-panel success mt-16">
                                <Icon name="check" />
                                <span>Lifecycle Completed</span>
                            </div>
                        ) : (
                            <p className="soft-text mt-16">No next step available for this status.</p>
                        )
                    )}
                </div>
                <div>
                    {aiSnapshot && <AiReviewCard snapshot={aiSnapshot} />}
                    <div className="card mt-24">
                        <div className="card-header">
                            <h2 className="card-title">Timeline</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ledger')}>Ledger</button>
                        </div>
                        <TransactionTimeline transactions={advanceTransactions} />
                    </div>
                </div>
            </div>
        </>
    )
}
