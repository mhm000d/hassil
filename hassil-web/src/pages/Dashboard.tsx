import type { DashboardAppState, DashboardUser } from '../types'
import Icon from '../components/Icon'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'
import TransactionTimeline from '../components/TransactionTimeline'

function getUserDisplayName(user: DashboardUser) {
    return `${user.firstName} ${user.lastName}`
}

function formatCurrency(value: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

function calculateQuote(invoice: { amount: number }) {
    return { advanceAmount: Math.round(invoice.amount * 0.8) }
}

export default function Dashboard({
    state,
    user,
    go,
}: {
    state: DashboardAppState
    user: DashboardUser
    go: (target: string, params?: Record<string, unknown>) => void
}) {
    return <DashboardPage state={state} user={user} go={go} />
}

function DashboardPage({ state, user, go }: { state: DashboardAppState; user: DashboardUser; go: (target: string, params?: Record<string, unknown>) => void }) {
    const userInvoices = state.invoices.filter((invoice) => invoice.userId === user.id)
    const userAdvances = state.advanceRequests.filter((advance) => advance.userId === user.id)
    const outstanding = userInvoices
        .filter((invoice) => invoice.status !== 'Paid' && invoice.status !== 'Rejected')
        .reduce((sum, invoice) => sum + invoice.amount, 0)
    const activeAdvances = userAdvances.filter((advance) => !['Repaid', 'Rejected'].includes(advance.status))
    const balance = state.transactions
        .filter((tx) => tx.userId === user.id)
        .reduce((sum, tx) => sum + (tx.direction === 'Debit' ? -tx.amount : tx.amount), 0)
    const recentTx = state.transactions.filter((tx) => tx.userId === user.id).slice(0, 5)
    const model = user.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring'

    return (
        <>
            <PageHeading title="Dashboard" description={`${getUserDisplayName(user)} · ${model}`} />
            <DashboardHero
                state={state}
                user={user}
                outstanding={outstanding}
                activeAdvances={activeAdvances.length}
                balance={balance}
                go={go}
            />
            <div className="grid-2 wide-left">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Invoices</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => go('invoices')}>
                            View all
                        </button>
                    </div>
                    <Table
                        headers={['Invoice', 'Client', 'Amount', 'Status', 'Action']}
                        emptyTitle="No invoices yet"
                        emptyDescription="Create an invoice to see advance options."
                        emptyAction={
                            <button className="btn btn-primary btn-sm" onClick={() => go('newInvoice')}>
                                <Icon name="plus" /> Create invoice
                            </button>
                        }
                        rows={userInvoices.slice(0, 5).map((invoice) => [
                            <button className="link-button" onClick={() => go('invoiceDetail', { invoiceId: invoice.id })} key="invoice">
                                {invoice.invoiceNumber}
                            </button>,
                            invoice.client.name,
                            formatCurrency(invoice.amount, invoice.currency),
                            <StatusBadge status={invoice.status} key="status" />,
                            invoice.advanceRequestId ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => go('advanceDetail', { advanceId: invoice.advanceRequestId })} key="action">
                                    <Icon name="open" /> Open advance
                                </button>
                            ) : (
                                <button className="btn btn-primary btn-sm" onClick={() => go('advanceRequest', { invoiceId: invoice.id })} key="action">
                                    <Icon name="advance" /> Request advance
                                </button>
                            ),
                        ])}
                    />
                </div>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Recent ledger</h2>
                        <button className="btn btn-secondary btn-sm" onClick={() => go('ledger')}>
                            Open
                        </button>
                    </div>
                    <TransactionTimeline transactions={recentTx} />
                </div>
            </div>
        </>
    )
}

function DashboardHero({
    state,
    user,
    outstanding,
    activeAdvances,
    balance,
    go,
}: {
    state: DashboardAppState
    user: DashboardUser
    outstanding: number
    activeAdvances: number
    balance: number
    go: (target: string, params?: Record<string, unknown>) => void
}) {
    const openInvoices = state.invoices.filter((invoice) => invoice.userId === user.id && invoice.status !== 'Paid' && invoice.status !== 'Rejected')
    const availableNow = openInvoices.reduce((sum, invoice) => sum + calculateQuote(invoice).advanceAmount, 0)
    const pendingAmount = state.advanceRequests
        .filter((advance) => advance.userId === user.id && !['Repaid', 'Rejected'].includes(advance.status))
        .reduce((sum, advance) => sum + advance.advanceAmount, 0)
    const recentEarnings = state.transactions
        .filter((tx) => tx.userId === user.id && tx.direction === 'Credit')
        .reduce((sum, tx) => sum + tx.amount, 0)
    const firstOpenInvoice = openInvoices.find((invoice) => !invoice.advanceRequestId) || openInvoices[0]

    return (
        <section className="dashboard-hero">
            <div className="hero-main-card">
                <div className="hero-card-label">Available to advance</div>
                <strong>{formatCurrency(availableNow, 'USD')}</strong>
                <p>{openInvoices.length} open receivables eligible under current trust limits.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => (firstOpenInvoice ? go('advanceRequest', { invoiceId: firstOpenInvoice.id }) : go('newInvoice'))}>
                    <Icon name="advance" /> {firstOpenInvoice ? 'Request advance' : 'Create invoice'}
                </button>
                <div className="hero-watermark">
                    <Icon name="chart" />
                </div>
            </div>
            <div className="hero-mini-card">
                <span>Pending advances</span>
                <strong>{formatCurrency(pendingAmount, 'USD')}</strong>
                <div className="mini-progress">
                    <i style={{ width: `${Math.min(100, activeAdvances * 32)}%` }} />
                </div>
                <p>{activeAdvances} active request{activeAdvances === 1 ? '' : 's'}</p>
            </div>
            <div className="hero-mini-card">
                <span>Recent earnings</span>
                <strong>{formatCurrency(recentEarnings || balance, 'USD')}</strong>
                <div className="mini-bars" aria-hidden="true">
                    <i style={{ height: '34%' }} />
                    <i style={{ height: '54%' }} />
                    <i style={{ height: '78%' }} />
                    <i style={{ height: '48%' }} />
                    <i style={{ height: '92%' }} />
                </div>
                <p>{formatCurrency(outstanding, 'USD')} still outstanding</p>
            </div>
        </section>
    )
}
