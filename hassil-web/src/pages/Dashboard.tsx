import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DashboardSummary } from '../types'
import { formatCurrency, getModelLabel } from '../utils/formatters'
import { DashboardService } from '../services'
import { useAuth, useAdvances, useInvoices } from '../hooks'
import Icon, { type IconName } from '../components/Icon'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'
import TransactionTimeline from '../components/TransactionTimeline'

type DashboardAction = {
    title: string
    description: string
    label: string
    icon: IconName
    tone: 'primary' | 'warning' | 'success' | 'default'
    count?: number
    onClick: () => void
}

function PriorityCard({ action }: { action: DashboardAction }) {
    return (
        <button className={`dashboard-priority-card ${action.tone}`} onClick={action.onClick}>
            <span className="dashboard-priority-icon">
                <Icon name={action.icon} />
            </span>
            <span className="dashboard-priority-body">
                <strong>{action.title}</strong>
                <em>{action.description}</em>
            </span>
            {typeof action.count === 'number' && <span className="dashboard-priority-count">{action.count}</span>}
            <span className="dashboard-priority-cta">{action.label}</span>
        </button>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { invoices } = useInvoices()
    const { advances } = useAdvances()
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [loadingSummary, setLoadingSummary] = useState(true)
    const [summaryError, setSummaryError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        const loadSummary = async () => {
            if (!user) {
                setLoadingSummary(false)
                return
            }

            try {
                setLoadingSummary(true)
                setSummaryError(null)
                const data = await DashboardService.summary()
                if (active) setSummary(data)
            } catch (err: any) {
                if (active) setSummaryError(err.message || 'Failed to load dashboard summary')
            } finally {
                if (active) setLoadingSummary(false)
            }
        }

        loadSummary()

        return () => {
            active = false
        }
    }, [user])

    if (!user) {
        return (
            <div className="card">
                <h2 className="card-title">Loading dashboard</h2>
                <p className="soft-text mt-8">Fetching your account and cash-flow summary.</p>
            </div>
        )
    }

    const displayName = user.displayName
        ?? user.name
        ?? user.smallBusinessProfile?.businessName
        ?? user.freelancerProfile?.fullName
        ?? user.email

    const financingModel = summary?.financingModel
        ?? (user.accountType === 'Freelancer' ? 'InvoiceDiscounting' : 'InvoiceFactoring')
    const model = getModelLabel(financingModel)
    const quoteReadyInvoices = invoices.filter((invoice) => invoice.status === 'Submitted' && !invoice.advanceRequestId)
    const draftInvoices = invoices.filter((invoice) => invoice.status === 'Draft')
    const pendingClientAdvances = advances.filter((advance) => advance.status === 'PendingClientConfirmation')
    const pendingReviewAdvances = advances.filter((advance) => advance.status === 'PendingReview')
    const approvedAdvances = advances.filter((advance) => advance.status === 'Approved')
    const settlementAdvances = advances.filter((advance) =>
        ['Disbursed', 'ClientPaymentDetected', 'ClientPaidHassil'].includes(advance.status))

    // const firstActionInvoice = quoteReadyInvoices[0] ?? draftInvoices[0] ?? invoices.find((invoice) => !invoice.advanceRequestId)

    const outstandingInvoices = summary?.outstandingInvoices ?? { count: 0, amount: 0 }
    const activeAdvances = summary?.activeAdvances ?? { count: 0, amount: 0 }
    const expectedRepayments = summary?.expectedRepayments ?? { count: 0, amount: 0 }
    const reviewStates = summary?.reviewStates ?? {
        pendingClientConfirmation: 0,
        pendingReview: 0,
        approvedReadyForDisbursement: 0,
    }
    const waitingChecks = reviewStates.pendingClientConfirmation + reviewStates.pendingReview
    const recentTx = summary?.recentTransactions ?? []
    const priorityActions: DashboardAction[] = [
        ...(quoteReadyInvoices.length > 0 ? [{
            title: 'Invoices ready for quote',
            description: 'Submitted invoices can now show available cash and fee.',
            label: 'View quote',
            icon: 'advance' as IconName,
            tone: 'primary' as const,
            count: quoteReadyInvoices.length,
            onClick: () => navigate(`/invoices/${quoteReadyInvoices[0].id}/advance`),
        }] : []),
        ...(pendingClientAdvances.length > 0 ? [{
            title: 'Waiting on client confirmation',
            description: 'Factoring requests need client approval before review completes.',
            label: pendingClientAdvances[0].clientConfirmationToken ? 'Open link' : 'Track',
            icon: 'link' as IconName,
            tone: 'warning' as const,
            count: pendingClientAdvances.length,
            onClick: () => navigate(pendingClientAdvances[0].clientConfirmationToken
                ? `/client/confirm/${pendingClientAdvances[0].clientConfirmationToken}`
                : `/advances/${pendingClientAdvances[0].id}`),
        }] : []),
        ...(approvedAdvances.length > 0 ? [{
            title: 'Approved advances ready',
            description: 'Funding is approved and ready to continue.',
            label: 'Continue',
            icon: 'advance' as IconName,
            tone: 'success' as const,
            count: approvedAdvances.length,
            onClick: () => navigate(`/advances/${approvedAdvances[0].id}`),
        }] : []),
        ...(pendingReviewAdvances.length > 0 ? [{
            title: 'Under review',
            description: 'Requests are waiting for risk and admin decisioning.',
            label: 'Track review',
            icon: 'review' as IconName,
            tone: 'default' as const,
            count: pendingReviewAdvances.length,
            onClick: () => navigate(`/advances/${pendingReviewAdvances[0].id}`),
        }] : []),
        ...(settlementAdvances.length > 0 ? [{
            title: 'Settlement in progress',
            description: 'Follow repayment, client payment, or buffer release.',
            label: 'Track',
            icon: 'ledger' as IconName,
            tone: 'primary' as const,
            count: settlementAdvances.length,
            onClick: () => navigate(`/advances/${settlementAdvances[0].id}`),
        }] : []),
        ...(draftInvoices.length > 0 ? [{
            title: 'Draft invoices unfinished',
            description: 'Submit drafts to unlock quote and advance options.',
            label: 'Continue',
            icon: 'invoice' as IconName,
            tone: 'warning' as const,
            count: draftInvoices.length,
            onClick: () => navigate(`/invoices/${draftInvoices[0].id}`),
        }] : []),
    ]
    const visiblePriorityActions = priorityActions.length > 0
        ? priorityActions.slice(0, 4)
        : [{
            title: 'Create an invoice',
            description: 'Start with a confirmed invoice to see your advance options.',
            label: 'Create invoice',
            icon: 'plus' as IconName,
            tone: 'primary' as const,
            onClick: () => navigate('/invoices/new'),
        }]

    return (
        <>
            <PageHeading title="Dashboard" description={`${displayName} · ${model}`} />

            {summaryError && <p className="error-text mb-18">{summaryError}</p>}

            <section className="dashboard-action-hub">
                <div className="dashboard-action-header">
                    <div>
                        <span>Action hub</span>
                        <h2>Today&apos;s priorities</h2>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/invoices')}>
                        Open invoice center
                    </button>
                </div>
                <div className="dashboard-priority-grid">
                    {visiblePriorityActions.map((action) => (
                        <PriorityCard key={action.title} action={action} />
                    ))}
                </div>
            </section>

            <section className="dashboard-hero">
                <div className="hero-main-card">
                    <div className="hero-card-label">{loadingSummary ? 'Loading summary' : 'Outstanding invoices'}</div>
                    <strong>{formatCurrency(outstandingInvoices.amount)}</strong>
                    <p>
                        {outstandingInvoices.count} open receivable{outstandingInvoices.count === 1 ? '' : 's'} tracked for this account.
                    </p>
                    <div className="hero-watermark">
                        <Icon name="chart" />
                    </div>
                </div>
                <div className="hero-mini-card">
                    <span>Active advances</span>
                    <strong>{formatCurrency(activeAdvances.amount)}</strong>
                    <div className="mini-progress">
                        <i style={{ width: `${Math.min(100, activeAdvances.count * 32)}%` }} />
                    </div>
                    <p>
                        {activeAdvances.count} active request{activeAdvances.count === 1 ? '' : 's'}, {reviewStates.approvedReadyForDisbursement} ready for funding
                    </p>
                </div>
                <div className="hero-mini-card">
                    <span>Ledger balance</span>
                    <strong>{formatCurrency(summary?.ledgerBalance ?? 0)}</strong>
                    <div className="mini-bars" aria-hidden="true">
                        <i style={{ height: '34%' }} />
                        <i style={{ height: '54%' }} />
                        <i style={{ height: '78%' }} />
                        <i style={{ height: '48%' }} />
                        <i style={{ height: '92%' }} />
                    </div>
                    <p>{formatCurrency(expectedRepayments.amount)} expected repayment · {waitingChecks} waiting on checks</p>
                </div>
            </section>

            <div className="grid-2 wide-left">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Invoices</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/invoices')}>
                            View all
                        </button>
                    </div>
                    <Table
                        headers={['Invoice', 'Client', 'Amount', 'Status', 'Action']}
                        emptyTitle="No invoices yet"
                        emptyDescription="Create an invoice to see advance options."
                        emptyAction={
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices/new')}>
                                <Icon name="plus" /> Create invoice
                            </button>
                        }
                        rows={invoices.slice(0, 5).map((invoice) => [
                            <button
                                className="link-button"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                                key="num"
                            >
                                {invoice.invoiceNumber}
                            </button>,
                            invoice.client.name,
                            formatCurrency(invoice.amount, invoice.currency),
                            <StatusBadge status={invoice.status} key="status" />,
                            invoice.advanceRequestId ? (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/advances/${invoice.advanceRequestId}`)}
                                    key="action"
                                >
                                    <Icon name="open" /> Open advance
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => navigate(invoice.status === 'Draft'
                                        ? `/invoices/${invoice.id}`
                                        : `/invoices/${invoice.id}/advance`)}
                                    key="action"
                                >
                                    <Icon name="advance" /> {invoice.status === 'Draft' ? 'Open invoice' : 'Request advance'}
                                </button>
                            ),
                        ])}
                    />
                </div>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent ledger</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ledger')}>
                            Open
                        </button>
                    </div>
                    <TransactionTimeline transactions={recentTx} />
                </div>
            </div>
        </>
    )
}
