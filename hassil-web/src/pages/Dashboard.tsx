import { useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { mockUsers, formatCurrency, calculateQuote } from '../data/mockApi'
import { useAuth, useInvoices, useAdvances, useTransactions } from '../hooks'
import Icon from '../components/Icon'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'
import TransactionTimeline from '../components/TransactionTimeline'

const seedUser: User = mockUsers[0]

export default function Dashboard() {
    const navigate = useNavigate()
    const { user: authUser } = useAuth()
    
    const { invoices } = useInvoices()
    const { advances } = useAdvances()
    const { transactions } = useTransactions()


    const model = (authUser?.accountType ?? seedUser.accountType) === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring'
    const displayName = authUser?.displayName
        ?? authUser?.name
        ?? seedUser.smallBusinessProfile?.businessName
        ?? seedUser.freelancerProfile?.fullName
        ?? seedUser.email

    const openInvoices = invoices.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Rejected')
    const availableNow = openInvoices.reduce((sum, inv) => sum + calculateQuote(authUser || seedUser, inv).advanceAmount, 0)
    const outstanding = openInvoices.reduce((sum, inv) => sum + inv.amount, 0)

    const activeAdvances = advances.filter((adv) => !['Repaid', 'Rejected'].includes(adv.status))
    const pendingAmount = activeAdvances.reduce((sum, adv) => sum + adv.advanceAmount, 0)

    const recentEarnings = transactions
        .filter((tx) => tx.direction === 'Credit')
        .reduce((sum, tx) => sum + tx.amount, 0)

    const recentTx = transactions.slice(0, 5)
    const firstOpenInvoice = openInvoices.find((inv) => !inv.advanceRequestId) ?? openInvoices[0]

    return (
        <>
            <PageHeading title="Dashboard" description={`${displayName} · ${model}`} />

            {/* Hero */}
            <section className="dashboard-hero">
                <div className="hero-main-card">
                    <div className="hero-card-label">Available to advance</div>
                    <strong>{formatCurrency(availableNow)}</strong>
                    <p>{openInvoices.length} open receivables eligible under current trust limits.</p>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                            firstOpenInvoice
                                ? navigate(`/invoices/${firstOpenInvoice.id}/advance`)
                                : navigate('/invoices/new')
                        }
                    >
                        <Icon name="advance" />
                        {firstOpenInvoice ? 'Request advance' : 'Create invoice'}
                    </button>
                    <div className="hero-watermark">
                        <Icon name="chart" />
                    </div>
                </div>
                <div className="hero-mini-card">
                    <span>Pending advances</span>
                    <strong>{formatCurrency(pendingAmount)}</strong>
                    <div className="mini-progress">
                        <i style={{ width: `${Math.min(100, activeAdvances.length * 32)}%` }} />
                    </div>
                    <p>
                        {activeAdvances.length} active request{activeAdvances.length === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="hero-mini-card">
                    <span>Recent earnings</span>
                    <strong>{formatCurrency(recentEarnings)}</strong>
                    <div className="mini-bars" aria-hidden="true">
                        <i style={{ height: '34%' }} />
                        <i style={{ height: '54%' }} />
                        <i style={{ height: '78%' }} />
                        <i style={{ height: '48%' }} />
                        <i style={{ height: '92%' }} />
                    </div>
                    <p>{formatCurrency(outstanding)} still outstanding</p>
                </div>
            </section>

            {/* Invoices + Ledger */}
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
                                    onClick={() => navigate(`/invoices/${invoice.id}/advance`)}
                                    key="action"
                                >
                                    <Icon name="advance" /> Request advance
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
