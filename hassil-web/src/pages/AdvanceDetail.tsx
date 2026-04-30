import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceRequest, Invoice } from '../types'
import {
    formatCurrency,
    formatDate,
    getModelLabel,
    getNextSimulationLabel,
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
            description: 'The client needs to confirm the invoice before Hassil can finish review.',
            primaryLabel: 'Open client link',
        }
    }

    if (advance.status === 'PendingReview') {
        return {
            tone: 'primary',
            title: 'Waiting for review',
            description: 'Hassil is checking invoice details, repayment path, and trust score.',
            primaryLabel: null,
        }
    }

    if (advance.status === 'Approved') {
        return {
            tone: 'success',
            title: 'Approved for funding',
            description: 'The request is approved. Move it to funding when you want to demo disbursement.',
            primaryLabel: 'Simulate disbursement',
        }
    }

    if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'Disbursed') {
        return {
            tone: 'primary',
            title: 'Waiting for client payment',
            description: 'The client pays Hassil on the invoice due date, then the remaining buffer is released.',
            primaryLabel: 'Simulate client payment',
        }
    }

    if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'ClientPaidHassil') {
        return {
            tone: 'success',
            title: 'Release settlement buffer',
            description: 'Hassil has collected repayment. Release the remaining balance after the fee.',
            primaryLabel: 'Simulate buffer release',
        }
    }

    if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'Disbursed') {
        return {
            tone: 'primary',
            title: 'Waiting for client payment to user',
            description: 'The client relationship stays private. Hassil waits for the user to receive payment.',
            primaryLabel: 'Simulate payment detection',
        }
    }

    if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'ClientPaymentDetected') {
        return {
            tone: 'success',
            title: 'Repay Hassil',
            description: 'The client payment was detected. Repay the advance plus the fixed fee.',
            primaryLabel: 'Simulate repayment',
        }
    }

    if (advance.status === 'Rejected') {
        return {
            tone: 'warning',
            title: 'Request rejected',
            description: advance.rejectionReason ?? 'Review the decision and create a stronger invoice request.',
            primaryLabel: null,
        }
    }

    return {
        tone: 'success',
        title: 'Advance settled',
        description: 'The funding lifecycle is complete. Review the ledger for the final movement.',
        primaryLabel: null,
    }
}

export default function AdvanceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { get: getInvoice, refetch: refetchInvoices } = useInvoices()
    const {
        get: getAdvance,
        simulateDisbursement,
        simulateClientPaymentDetected,
        simulateUserRepayment,
        simulateClientPaymentToHassil,
        simulateBufferRelease,
    } = useAdvances()
    const { transactions: allTransactions, refetch: refetchTransactions } = useTransactions()

    const [advance, setAdvance] = useState<AdvanceRequest | null>(null)
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)
    const [simulating, setSimulating] = useState(false)
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

    const simulate = async () => {
        if (!advance || simulating) return

        try {
            setSimulating(true)
            setError(null)

            let updated: AdvanceRequest | undefined

            if (advance.status === 'Approved') {
                updated = await simulateDisbursement(advance.id)
            } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'Disbursed') {
                updated = await simulateClientPaymentToHassil(advance.id)
            } else if (advance.financingModel === 'InvoiceFactoring' && advance.status === 'ClientPaidHassil') {
                updated = await simulateBufferRelease(advance.id)
            } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'Disbursed') {
                updated = await simulateClientPaymentDetected(advance.id)
            } else if (advance.financingModel === 'InvoiceDiscounting' && advance.status === 'ClientPaymentDetected') {
                updated = await simulateUserRepayment(advance.id)
            }

            if (!updated) return

            setAdvance(updated)
            const invData = await getInvoice(updated.invoiceId)
            if (invData) setInvoice(invData)
            await Promise.all([refetchInvoices(), refetchTransactions()])
        } catch (err: any) {
            setError(err.message || 'Failed to move advance to the next step')
        } finally {
            setSimulating(false)
        }
    }

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

    const nextLabel = getNextSimulationLabel(advance.status, advance.financingModel)
    const transactions = advance.transactions && advance.transactions.length > 0
        ? advance.transactions
        : allTransactions.filter((tx) => tx.advanceRequestId === id)
    const confirmationToken = advance.clientConfirmationToken
    const nextStep = getAdvanceNextStep(advance)
    const primaryActionLabel = nextLabel ?? nextStep.primaryLabel

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
                    {advance.status === 'PendingClientConfirmation' && confirmationToken ? (
                        <button className="btn btn-primary" onClick={() => navigate(`/client/confirm/${confirmationToken}`)}>
                            <Icon name="link" /> Open client link
                        </button>
                    ) : primaryActionLabel ? (
                        <button className="btn btn-sim" onClick={simulate} disabled={simulating}>
                            <Icon name="next" /> {simulating ? 'Updating...' : primaryActionLabel}
                        </button>
                    ) : (
                        <button className="btn btn-secondary" onClick={() => navigate('/ledger')}>
                            <Icon name="ledger" /> Open ledger
                        </button>
                    )}
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
                            Client confirmation is required before this request can move to review or funding.
                            {confirmationToken && (
                                <button
                                    className="btn btn-secondary btn-sm ml-auto"
                                    onClick={() => navigate(`/client/confirm/${confirmationToken}`)}
                                >
                                    <Icon name="open" /> Open client link
                                </button>
                            )}
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
