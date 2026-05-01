import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceRequest, Invoice } from '../types'
import {
    formatCurrency,
    formatDate,
    getModelLabel,
} from '../utils/formatters'
import { useInvoices, useAdvances, useTransactions } from '../hooks'
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

function getAdvanceNextStep(advance: AdvanceRequest) {
    if (advance.status === 'PendingClientConfirmation') {
        return {
            tone: 'warning',
            title: 'Client confirmation needed',
            description: 'Hassil operations will issue and track the client confirmation before review continues.',
            actionLabel: 'Admin action pending',
        }
    }

    if (advance.status === 'PendingReview') {
        return {
            tone: 'primary',
            title: 'Waiting for review',
            description: 'Hassil is checking invoice details, repayment path, and trust score.',
            actionLabel: 'Under review',
        }
    }

    if (advance.status === 'Approved') {
        return {
            tone: 'success',
            title: 'Approved for funding',
            description: 'The request is approved. Hassil operations will disburse the advance.',
            actionLabel: 'Funding pending',
        }
    }

    if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'Disbursed') {
        return {
            tone: 'primary',
            title: 'Waiting for client payment',
            description: 'The client pays Hassil on the invoice due date, then operations releases the remaining buffer.',
            actionLabel: 'Collection pending',
        }
    }

    if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'ClientPaidHassil') {
        return {
            tone: 'success',
            title: 'Release settlement buffer',
            description: 'Hassil has collected repayment. Operations will release the remaining balance after the fee.',
            actionLabel: 'Buffer release pending',
        }
    }

    if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'Disbursed') {
        return {
            tone: 'primary',
            title: 'Waiting for client payment to user',
            description: 'The client relationship stays private. Hassil waits to detect that payment was received.',
            actionLabel: 'Payment detection pending',
        }
    }

    if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'ClientPaymentDetected') {
        return {
            tone: 'success',
            title: 'Repay Hassil',
            description: 'The client payment was detected. Operations will collect the advance plus the fixed fee.',
            actionLabel: 'Repayment pending',
        }
    }

    if (advance.status === 'Rejected') {
        return {
            tone: 'warning',
            title: 'Request rejected',
            description: advance.rejectionReason ?? 'Review the decision and create a stronger invoice request.',
            actionLabel: null,
        }
    }

    return {
        tone: 'success',
        title: 'Advance settled',
        description: 'The funding lifecycle is complete. Review the ledger for the final movement.',
        actionLabel: null,
    }
}

export default function AdvanceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { get: getInvoice } = useInvoices()
    const { get: getAdvance } = useAdvances()
    const { transactions: allTransactions } = useTransactions()

    const [advance, setAdvance] = useState<AdvanceRequest | null>(null)
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = async () => {
        if (!id) return

        try {
            setLoading(true)
            setError(null)

            const advData = await getAdvance(id)
            if (!advData) return

            setAdvance(advData)

            const invData = await getInvoice(advData.invoiceId)
            if (invData) setInvoice(invData)
        } catch (err: any) {
            setError(err.message || 'Failed to load advance request')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [id])

    if (loading) {
        return (
            <div className="card">
                <h2 className="card-title">Loading advance</h2>
                <p className="soft-text mt-8">Fetching the latest request, invoice, and ledger state.</p>
            </div>
        )
    }

    if (!advance || !invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Advance not found</h2>
                {error && <p className="error-text mt-8">{error}</p>}
                <button className="btn btn-primary mt-16" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
            </div>
        )
    }

    const transactions = advance.transactions && advance.transactions.length > 0
        ? advance.transactions
        : allTransactions.filter((tx) => tx.advanceRequestId === id)
    const nextStep = getAdvanceNextStep(advance)

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
            <section className={`advance-workflow-card ${nextStep.tone}`}>
                <div>
                    <span>Current step</span>
                    <h2>{nextStep.title}</h2>
                    <p>{nextStep.description}</p>
                </div>
                <div className="advance-workflow-actions">
                    <StatusBadge status={advance.status} />
                    {/*{nextStep.actionLabel ? (*/}
                    {/*    <button className="btn btn-secondary" disabled>*/}
                    {/*        <Icon name="review" /> {nextStep.actionLabel}*/}
                    {/*    </button>*/}
                    {/*) : (*/}
                    {/*    <button className="btn btn-secondary" onClick={() => navigate('/ledger')}>*/}
                    {/*        <Icon name="ledger" /> Open ledger*/}
                    {/*    </button>*/}
                    {/*)}*/}
                </div>
            </section>
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
                            {/*<ModelBadge model={advance.financingModel} />*/}
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
                                ['Client payment redirect', advance.clientPaymentRedirectRequired ? 'Required' : 'Not required'],
                                ['Fee collection', advance.feeCollectionTiming === 'FromSettlementBuffer' ? 'From settlement buffer' : 'At repayment'],
                                ['Settlement buffer', formatCurrency(advance.settlementBufferAmount, invoice.currency)],
                                ['Review score', `${advance.reviewScore}/100`],
                                ['Approval mode', advance.approvalMode ?? 'N/A'],
                            ]}
                        />
                    </DisclosurePanel>

                    {advance.status === 'PendingClientConfirmation' && (
                        <div className="quote-disclaimer mt-16">
                            Client confirmation is required before this request can move to review or funding. Hassil operations will send and track the confirmation link.
                        </div>
                    )}

                    {error && <p className="error-text mt-16">{error}</p>}
                </div>
                <div>
                    <div className="card">
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
