import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice, User } from '../types'
import { mockApi, mockUsers, formatCurrency, formatDate, daysUntilDate, calculateQuote } from '../data/mockApi'
import PageHeading from '../components/PageHeading'
import EmptyPanel from '../components/EmptyPanel'
import Icon from '../components/Icon'

const currentUser: User = mockUsers[0]

function StatCard({ tone, label, value, sub }: { tone: 'gold' | 'green' | 'amber' | 'blue'; label: string; value: string; sub?: string }) {
    const toneLabel = { gold: '01', green: '02', amber: '03', blue: '04' }[tone]
    return (
        <div className={`stat-card ${tone}`}>
            <div className={`stat-icon ${tone}`}>{toneLabel}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    )
}

function CashFlowChart({ weeks }: { weeks: { label: string; total: number }[] }) {
    const max = Math.max(...weeks.map((w) => w.total), 1)
    return (
        <div className="cash-chart">
            <div className="space-between">
                <h2 className="card-title"><Icon name="chart" /> Expected cash by week</h2>
            </div>
            <div className="cash-chart-bars">
                {weeks.map((week) => (
                    <div className="cash-chart-row" key={week.label}>
                        <span>{week.label}</span>
                        <div>
                            <strong style={{ width: `${Math.max(8, (week.total / max) * 100)}%` }} />
                        </div>
                        <em>{formatCurrency(week.total)}</em>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function CashFlow() {
    const navigate = useNavigate()
    const [invoices, setInvoices] = useState<Invoice[]>([])

    useEffect(() => {
        mockApi.listInvoices(currentUser.id).then((res) => {
            setInvoices(res.data.filter((inv) => inv.status !== 'Paid' && inv.status !== 'Rejected'))
        })
    }, [])

    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const potentialAdvance = invoices.reduce((sum, inv) => sum + calculateQuote(currentUser, inv).advanceAmount, 0)
    const estimatedFees = invoices.reduce((sum, inv) => sum + calculateQuote(currentUser, inv).feeAmount, 0)
    const next30 = invoices.filter((inv) => daysUntilDate(inv.dueDate) <= 30).reduce((sum, inv) => sum + inv.amount, 0)

    const cashByWeek = invoices.reduce<{ label: string; total: number }[]>((weeks, invoice) => {
        const due = new Date(`${invoice.dueDate}T12:00:00`)
        const monday = new Date(due)
        monday.setDate(due.getDate() - ((due.getDay() + 6) % 7))
        const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = weeks.find((w) => w.label === label)
        if (existing) existing.total += invoice.amount
        else weeks.push({ label, total: invoice.amount })
        return weeks
    }, [])

    return (
        <>
            <PageHeading title="Cash-flow forecast" description="See open receivables and the advance amount available today." />
            <section className="stat-grid">
                <StatCard tone="gold" label="Forecasted receivables" value={formatCurrency(total)} sub={`${invoices.length} open invoices`} />
                <StatCard tone="green" label="Available now" value={formatCurrency(potentialAdvance)} sub="Based on current trust limits" />
                <StatCard tone="amber" label="Estimated fees" value={formatCurrency(estimatedFees)} sub="If all open invoices are advanced" />
                <StatCard
                    tone="blue"
                    label="Current model"
                    value={currentUser.accountType === 'Freelancer' ? 'Discounting' : 'Factoring'}
                    sub={currentUser.accountType === 'Freelancer' ? 'Private client relationship' : 'Client confirmation required'}
                />
            </section>
            <div className="cash-summary-grid mb-18">
                <div className="cash-summary-card">
                    <span>Due in 30 days</span>
                    <strong>{formatCurrency(next30)}</strong>
                </div>
                {cashByWeek.map((week) => (
                    <div className="cash-summary-card" key={week.label}>
                        <span>Week of {week.label}</span>
                        <strong>{formatCurrency(week.total)}</strong>
                    </div>
                ))}
            </div>
            <div className="card">
                {invoices.length === 0 ? (
                    <EmptyPanel
                        title="No open receivables"
                        description="Create an invoice to build a forecast."
                        action={
                            <button className="btn btn-primary btn-sm mt-12" onClick={() => navigate('/invoices/new')}>
                                <Icon name="plus" /> Create invoice
                            </button>
                        }
                    />
                ) : (
                    <>
                        <CashFlowChart weeks={cashByWeek} />
                        <div className="forecast-list mt-18">
                            {invoices.map((invoice) => {
                                const quote = calculateQuote(currentUser, invoice)
                                const width = Math.min(100, Math.round((invoice.amount / Math.max(total, 1)) * 100))
                                return (
                                    <div className="forecast-row" key={invoice.id}>
                                        <div className="forecast-main">
                                            <button className="link-button" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                                {invoice.invoiceNumber}
                                            </button>
                                            <span>{invoice.client.name}</span>
                                        </div>
                                        <div className="forecast-bar">
                                            <div style={{ width: `${width}%` }} />
                                        </div>
                                        <div className="forecast-meta">
                                            <span>{formatCurrency(invoice.amount, invoice.currency)} due {formatDate(invoice.dueDate)}</span>
                                            <strong>{formatCurrency(quote.advanceAmount, invoice.currency)} now · {formatCurrency(quote.feeAmount, invoice.currency)} fee</strong>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
