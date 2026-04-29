import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceRequest, AiReviewSnapshot, Invoice, Transaction, User } from '../types'
import {
    mockApi,
    mockUsers,
    generateId,
    formatCurrency,
    formatDate,
    formatDateTime,
    getModelLabel,
    getNextSimulationLabel,
} from '../data/mockApi'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import LifecycleStepper from '../components/LifecycleStepper'
import TransactionTimeline from '../components/TransactionTimeline'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

const currentUser: User = mockUsers[0]

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
    const [advance, setAdvance] = useState<AdvanceRequest | null>(null)
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [aiSnapshot, setAiSnapshot] = useState<AiReviewSnapshot | null>(null)

    const load = async () => {
        if (!id) return
        const advRes = await mockApi.getAdvanceRequest(id)
        if (!advRes.data) return
        setAdvance(advRes.data)
        const invRes = await mockApi.getInvoice(advRes.data.invoiceId)
        if (invRes.data) setInvoice(invRes.data)
        const txRes = await mockApi.listTransactions()
        setTransactions(txRes.data.filter((tx) => tx.advanceRequestId === id))
        const aiRes = await mockApi.getAiSnapshot(id)
        if (aiRes.data) setAiSnapshot(aiRes.data)
    }

    useEffect(() => { load() }, [id])

    const simulate = async () => {
        if (!advance || !invoice) return
        const now = new Date().toISOString()

        if (advance.status === 'Approved') {
            await mockApi.updateAdvanceRequest(advance.id, { status: 'Disbursed', updatedAt: now })
            await mockApi.updateInvoice(invoice.id, { status: 'Disbursed' })
            await mockApi.addTransaction({
                id: generateId('tx'), userId: advance.userId, invoiceId: invoice.id, advanceRequestId: advance.id,
                type: 'AdvanceDisbursement', direction: 'Credit', amount: advance.advanceAmount,
                description: `${formatCurrency(advance.advanceAmount, invoice.currency)} sent to bank account.`,
                createdAt: now,
            })
        } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'Disbursed') {
            await mockApi.updateAdvanceRequest(advance.id, { status: 'ClientPaidHassil', updatedAt: now })
            await mockApi.updateInvoice(invoice.id, { status: 'ClientPaidHassil' })
            await mockApi.addTransaction({
                id: generateId('tx'), userId: advance.userId, invoiceId: invoice.id, advanceRequestId: advance.id,
                type: 'ClientPaymentToHassil', direction: 'Credit', amount: invoice.amount,
                description: 'Client paid the invoice to Hassil.', createdAt: now,
            })
        } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'ClientPaidHassil') {
            await mockApi.updateAdvanceRequest(advance.id, { status: 'Repaid', updatedAt: now })
            await mockApi.updateInvoice(invoice.id, { status: 'Paid' })
            await mockApi.addTransaction({
                id: generateId('tx'), userId: advance.userId, invoiceId: invoice.id, advanceRequestId: advance.id,
                type: 'BufferRelease', direction: 'Credit', amount: advance.settlementBufferAmount,
                description: 'Remaining buffer released.', createdAt: now,
            })
        } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'Disbursed') {
            await mockApi.updateAdvanceRequest(advance.id, { status: 'ClientPaymentDetected', updatedAt: now })
            await mockApi.updateInvoice(invoice.id, { status: 'ClientPaymentDetected' })
            await mockApi.addTransaction({
                id: generateId('tx'), userId: advance.userId, invoiceId: invoice.id, advanceRequestId: advance.id,
                type: 'DetectedIncomingPayment', direction: 'Internal', amount: invoice.amount,
                description: 'Client payment detected in freelancer account.', createdAt: now,
            })
        } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'ClientPaymentDetected') {
            await mockApi.updateAdvanceRequest(advance.id, { status: 'Repaid', updatedAt: now })
            await mockApi.updateInvoice(invoice.id, { status: 'Paid' })
            await mockApi.addTransaction({
                id: generateId('tx'), userId: advance.userId, invoiceId: invoice.id, advanceRequestId: advance.id,
                type: 'UserRepayment', direction: 'Debit', amount: advance.expectedRepaymentAmount,
                description: 'Advance and fee repaid after client payment.', createdAt: now,
            })
        }
        await load()
    }

    if (!advance || !invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Advance not found</h2>
                <button className="btn btn-primary mt-16" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
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
                        <button className="btn btn-sim full-width mt-16" onClick={simulate}>
                            <Icon name="next" /> {nextLabel}
                        </button>
                    ) : (
                        <p className="soft-text mt-16">No next step available for this status.</p>
                    )}
                </div>
                <div>
                    {aiSnapshot && <AiReviewCard snapshot={aiSnapshot} />}
                    <div className="card mt-24">
                        <div className="card-header">
                            <h2 className="card-title">Timeline</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ledger')}>Ledger</button>
                        </div>
                        <TransactionTimeline transactions={transactions} />
                    </div>
                </div>
            </div>
        </>
    )
}
