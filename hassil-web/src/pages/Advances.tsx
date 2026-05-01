import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { useAdvances } from '../hooks'
import type { AdvanceRequest } from '../types'
import Icon, { type IconName } from '../components/Icon'
import ModelBadge from '../components/ModelBadge'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'

function isActiveAdvance(advance: AdvanceRequest) {
    return !['Rejected', 'Repaid', 'Defaulted', 'BufferReleased'].includes(advance.status)
}

function nextActionFor(advance: AdvanceRequest, navigate: ReturnType<typeof useNavigate>) {
    let title = 'Open advance'
    let hint = 'Review the request details and lifecycle.'
    let label = 'Open'
    let icon: IconName = 'open'
    let target = `/advances/${advance.id}`
    let tone: 'default' | 'primary' | 'warning' | 'success' = 'default'

    if (advance.status === 'PendingClientConfirmation') {
        title = 'Client confirmation needed'
        hint = 'Hassil operations will send and track the client confirmation link.'
        label = 'Track'
        icon = 'review'
        tone = 'warning'
    } else if (advance.status === 'PendingReview') {
        title = 'Under review'
        hint = 'Admin review and risk checks are still pending.'
        label = 'Track'
        icon = 'review'
        tone = 'primary'
    } else if (advance.status === 'Approved') {
        title = 'Ready to fund'
        hint = 'Approved and waiting for Hassil operations to disburse.'
        label = 'Track'
        icon = 'advance'
        tone = 'success'
    } else if (advance.status === 'Disbursed') {
        title = advance.financingModel === 'InvoiceFactoring'
            ? 'Waiting for client payment'
            : 'Waiting for payment detection'
        hint = advance.financingModel === 'InvoiceFactoring'
            ? 'Client repayment to Hassil is the next milestone.'
            : 'Hassil waits until the user receives client payment.'
        label = 'Track'
        icon = 'ledger'
        tone = 'primary'
    } else if (advance.status === 'ClientPaymentDetected') {
        title = 'Repayment due'
        hint = 'Client payment was detected. User repayment is next.'
        label = 'Repay'
        icon = 'ledger'
        tone = 'warning'
    } else if (advance.status === 'ClientPaidHassil') {
        title = 'Buffer release pending'
        hint = 'Client paid Hassil. Operations will release the remaining balance.'
        label = 'Track'
        icon = 'ledger'
        tone = 'success'
    } else if (['Repaid', 'BufferReleased'].includes(advance.status)) {
        title = 'Settled'
        hint = 'The advance lifecycle is complete.'
        label = 'View record'
        tone = 'success'
    } else if (advance.status === 'Rejected') {
        title = 'Rejected'
        hint = advance.rejectionReason ?? 'Review the decision before creating another request.'
        label = 'View decision'
        tone = 'warning'
    }

    return (
        <div className={`invoice-next-action advance-next-action ${tone}`}>
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

export default function Advances() {
    const navigate = useNavigate()
    const { advances, loading, error, refetch } = useAdvances()
    const awaitingClient = advances.filter((advance) => advance.status === 'PendingClientConfirmation').length
    const readyToFund = advances.filter((advance) => advance.status === 'Approved').length
    const activeCount = advances.filter(isActiveAdvance).length
    const totalAdvanced = advances
        .filter((advance) => ['Approved', 'Disbursed', 'ClientPaymentDetected', 'ClientPaidHassil', 'Repaid', 'BufferReleased'].includes(advance.status))
        .reduce((sum, advance) => sum + advance.advanceAmount, 0)

    return (
        <>
            <PageHeading title="Advances" description="Track requested advances, funding status, fees, and repayments." />
            <section className="invoice-command-grid">
                <div className="invoice-command-card">
                    <span>Active advances</span>
                    <strong>{activeCount}</strong>
                    <p>Requests still moving through confirmation, review, funding, or repayment.</p>
                </div>
                <div className="invoice-command-card">
                    <span>Waiting on client</span>
                    <strong>{awaitingClient}</strong>
                    <p>Factoring requests that need client confirmation.</p>
                </div>
                <div className="invoice-command-card">
                    <span>Approved to fund</span>
                    <strong>{readyToFund}</strong>
                    <p>{formatCurrency(totalAdvanced)} approved or already funded.</p>
                </div>
            </section>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Advance requests</h2>
                    <button className="btn btn-secondary btn-sm" onClick={refetch} disabled={loading}>
                        <Icon name="next" /> {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {error && <p className="error-text mb-18">{error}</p>}

                <Table
                    headers={['Invoice', 'Model', 'Amount', 'Status', 'Created', 'Next action']}
                    emptyTitle="No advance requests yet"
                    emptyDescription="Create and submit an invoice, then request an advance from the invoice details."
                    emptyAction={
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices')}>
                            <Icon name="invoice" /> Open invoices
                        </button>
                    }
                    rows={advances.map((advance) => [
                        <div className="invoice-primary-cell" key="invoice">
                            <button className="link-button" onClick={() => navigate(`/advances/${advance.id}`)}>
                                {advance.invoiceNumber ?? 'Advance request'}
                            </button>
                            <span>{advance.invoiceId}</span>
                        </div>,
                        <ModelBadge key="model" model={advance.financingModel} />,
                        <div className="invoice-client-cell" key="amount">
                            <strong>{formatCurrency(advance.advanceAmount)}</strong>
                            <span>{formatCurrency(advance.feeAmount)} fee</span>
                        </div>,
                        <StatusBadge key="status" status={advance.status} />,
                        formatDateTime(advance.createdAt),
                        nextActionFor(advance, navigate),
                    ])}
                />
            </div>
        </>
    )
}
