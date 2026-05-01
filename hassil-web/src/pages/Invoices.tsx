import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useAdvances, useInvoices } from '../hooks'
import type { AdvanceRequest, Invoice } from '../types'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'
import Icon, { type IconName } from '../components/Icon'

function sourceLabel(invoice: Invoice) {
    return invoice.receivableSource === 'DirectClientInvoice'
        ? 'Direct client invoice'
        : 'Platform payout'
}

function isAdvanceClosed(advance: AdvanceRequest) {
    return ['Rejected', 'Repaid', 'Defaulted', 'BufferReleased'].includes(advance.status)
}

export default function Invoices() {
    const navigate = useNavigate()
    const { invoices, loading, error, refetch } = useInvoices()
    const { advances } = useAdvances()

    const advancesByInvoice = useMemo(() => {
        return advances.reduce<Record<string, AdvanceRequest>>((lookup, advance) => {
            lookup[advance.invoiceId] = advance
            return lookup
        }, {})
    }, [advances])

    const readyForQuote = invoices.filter((invoice) => invoice.status === 'Submitted' && !invoice.advanceRequestId).length
    const waitingOnClient = advances.filter((advance) => advance.status === 'PendingClientConfirmation').length
    const activeAdvanceCount = advances.filter((advance) => !isAdvanceClosed(advance)).length

    const nextActionFor = (invoice: Invoice) => {
        const advance = advancesByInvoice[invoice.id]
        let title = 'Review invoice'
        let hint = 'Open the invoice details.'
        let label = 'Open'
        let icon: IconName = 'open'
        let target = `/invoices/${invoice.id}`
        let tone: 'default' | 'primary' | 'warning' | 'success' = 'default'

        if (invoice.status === 'Draft') {
            title = 'Finish invoice'
            hint = 'Submit it before requesting an advance.'
            label = 'Continue'
            tone = 'warning'
        } else if (advance) {
            target = `/advances/${advance.id}`

            if (advance.status === 'PendingClientConfirmation') {
                title = 'Waiting on client'
                hint = 'Hassil will track the client confirmation.'
                label = 'Track'
                icon = 'review'
                target = `/advances/${advance.id}`
                tone = 'warning'
            } else if (advance.status === 'PendingReview') {
                title = 'Under review'
                hint = 'Track the admin decision and risk checks.'
                label = 'Track'
                icon = 'review'
                tone = 'primary'
            } else if (advance.status === 'Approved') {
                title = 'Approved'
                hint = 'Continue to funding and disbursement.'
                label = 'Track funding'
                icon = 'advance'
                tone = 'success'
            } else if (['Disbursed', 'ClientPaymentDetected', 'ClientPaidHassil'].includes(advance.status)) {
                title = 'Settlement in progress'
                hint = 'Follow repayment and buffer release.'
                label = 'Track'
                icon = 'ledger'
                tone = 'primary'
            } else if (['Repaid', 'BufferReleased'].includes(advance.status)) {
                title = 'Settled'
                hint = 'View the completed advance record.'
                label = 'View record'
                tone = 'success'
            } else if (advance.status === 'Rejected') {
                title = 'Request rejected'
                hint = 'Review the decision before creating another request.'
                label = 'View decision'
                tone = 'warning'
            }
        } else if (invoice.status === 'Submitted') {
            title = 'Quote ready'
            hint = 'Review available cash, fee, and terms.'
            label = 'View quote'
            icon = 'advance'
            target = `/invoices/${invoice.id}/advance`
            tone = 'primary'
        } else if (['Paid', 'Cancelled', 'Rejected'].includes(invoice.status)) {
            title = 'No action needed'
            hint = 'This invoice is closed.'
            label = 'View'
        }

        return (
            <div className={`invoice-next-action ${tone}`}>
                <div>
                    <strong>{title}</strong>
                    <span>{hint}</span>
                </div>
                <button className={`btn ${tone === 'primary' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => navigate(target)}>
                    <Icon name={icon} /> {label}
                </button>
            </div>
        )
    }

    return (
        <>
            <PageHeading title="Invoices" description="Manage receivables, optional evidence, and advance requests." />
            <section className="invoice-command-grid">
                <div className="invoice-command-card">
                    <span>Ready for quote</span>
                    <strong>{readyForQuote}</strong>
                    <p>Submitted invoices without an advance request.</p>
                </div>
                <div className="invoice-command-card">
                    <span>Waiting on client</span>
                    <strong>{waitingOnClient}</strong>
                    <p>Factoring requests needing client confirmation.</p>
                </div>
                <div className="invoice-command-card">
                    <span>Active advances</span>
                    <strong>{activeAdvanceCount}</strong>
                    <p>Requests still moving through review, funding, or settlement.</p>
                </div>
            </section>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Invoice portfolio</h2>
                    {/*<button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>*/}
                    {/*    <Icon name="plus" /> Create Invoice*/}
                    {/*</button>*/}
                </div>
                {error && (
                    <div className="feedback-item error mb-18">
                        {error}
                        <button className="link-button" onClick={refetch}>Retry</button>
                    </div>
                )}
                {loading ? (
                    <p className="soft-text">Loading invoices...</p>
                ) : (
                <Table
                    headers={['Invoice', 'Client', 'Due date', 'Amount', 'Status', 'Next action']}
                    emptyTitle="No invoices yet"
                    emptyDescription="Create your first invoice to request an advance."
                    emptyAction={
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices/new')}>
                            <Icon name="plus" /> Create invoice
                        </button>
                    }
                    rows={invoices.map((invoice) => [
                        <div className="invoice-primary-cell" key="num">
                            <button className="link-button" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                {invoice.invoiceNumber}
                            </button>
                            <span>{sourceLabel(invoice)}</span>
                        </div>,
                        <div className="invoice-client-cell" key="client">
                            <strong>{invoice.client.name}</strong>
                            <span>{invoice.client.email}</span>
                        </div>,
                        formatDate(invoice.dueDate),
                        formatCurrency(invoice.amount, invoice.currency),
                        <StatusBadge key="status" status={invoice.status} />,
                        nextActionFor(invoice),
                    ])}
                />
                )}
            </div>
        </>
    )
}
