import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AdvanceQuote, AdvanceRequest, Invoice } from '../types'
import { formatCurrency, formatDate, daysUntilDate } from '../utils/formatters'
import { useAuth, useInvoices, useAdvances } from '../hooks'
import PageHeading from '../components/PageHeading'
import EmptyPanel from '../components/EmptyPanel'
import Icon from '../components/Icon'

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
    const max = Math.max(...weeks.map((week) => week.total), 1)
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

function CashActionCard({
    label,
    value,
    description,
    buttonLabel,
    onClick,
    tone,
    disabled = false,
}: {
    label: string
    value: string
    description: string
    buttonLabel: string
    onClick: () => void
    tone: 'primary' | 'warning' | 'default'
    disabled?: boolean
}) {
    return (
        <div className={`cash-action-card ${tone}`}>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{description}</p>
            </div>
            <button className={tone === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} onClick={onClick} disabled={disabled}>
                {buttonLabel}
            </button>
        </div>
    )
}

function isOpenReceivable(invoice: Invoice) {
    return !['Paid', 'Rejected', 'Cancelled'].includes(invoice.status)
}

function canRequestAdvance(invoice: Invoice) {
    return invoice.status === 'Submitted' && !invoice.advanceRequestId
}

function buildCashByWeek(invoices: Invoice[]) {
    const weekMap = new Map<string, { label: string; total: number; timestamp: number }>()

    invoices.forEach((invoice) => {
        const due = new Date(`${invoice.dueDate}T12:00:00`)
        const monday = new Date(due)
        monday.setDate(due.getDate() - ((due.getDay() + 6) % 7))
        const key = monday.toISOString().slice(0, 10)
        const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = weekMap.get(key)

        if (existing) existing.total += invoice.amount
        else weekMap.set(key, { label, total: invoice.amount, timestamp: monday.getTime() })
    })

    return [...weekMap.values()]
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ label, total }) => ({ label, total }))
}

function quoteSummary(
    invoice: Invoice,
    quote: AdvanceQuote | undefined,
    advance: AdvanceRequest | undefined,
    currency: string,
) {
    if (advance) {
        return `${formatCurrency(advance.advanceAmount, currency)} advanced/requested · ${advance.status}`
    }

    if (invoice.status === 'Draft') return 'Submit invoice to unlock an advance quote'
    if (!canRequestAdvance(invoice)) return `Advance unavailable from ${invoice.status} status`
    if (!quote) return 'Checking advance quote'
    if (!quote.isEligible) return quote.eligibilityMessages[0] ?? 'Not currently eligible'

    return `${formatCurrency(quote.advanceAmount, currency)} available · ${formatCurrency(quote.feeAmount, currency)} fee`
}

function getInvoiceAction(
    invoice: Invoice,
    quote: AdvanceQuote | undefined,
    advance: AdvanceRequest | undefined,
    quoteLoading: boolean,
) {
    if (advance) {
        return {
            label: 'Track advance',
            target: `/advances/${advance.id}`,
            disabled: false,
        }
    }

    if (invoice.status === 'Draft') {
        return {
            label: 'Submit invoice',
            target: `/invoices/${invoice.id}`,
            disabled: false,
        }
    }

    if (canRequestAdvance(invoice)) {
        if (quote?.isEligible) {
            return {
                label: 'Review quote',
                target: `/invoices/${invoice.id}/advance`,
                disabled: false,
            }
        }

        return {
            label: quoteLoading && !quote ? 'Checking quote' : 'View issue',
            target: `/invoices/${invoice.id}`,
            disabled: quoteLoading && !quote,
        }
    }

    return {
        label: 'View invoice',
        target: `/invoices/${invoice.id}`,
        disabled: false,
    }
}

export default function CashFlow() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { invoices, loading: invoicesLoading, error: invoicesError } = useInvoices()
    const { advances, quote: quoteAdvance } = useAdvances()
    const [quotesByInvoice, setQuotesByInvoice] = useState<Record<string, AdvanceQuote>>({})
    const [quotesLoading, setQuotesLoading] = useState(false)
    const [quoteError, setQuoteError] = useState<string | null>(null)

    const openInvoices = useMemo(
        () => invoices.filter(isOpenReceivable),
        [invoices],
    )

    const advancesByInvoice = useMemo(() => {
        return advances.reduce<Record<string, AdvanceRequest>>((lookup, advance) => {
            lookup[advance.invoiceId] = advance
            return lookup
        }, {})
    }, [advances])

    useEffect(() => {
        let active = true
        const quoteCandidates = openInvoices.filter(canRequestAdvance)

        const loadQuotes = async () => {
            if (quoteCandidates.length === 0) {
                setQuotesByInvoice({})
                setQuoteError(null)
                return
            }

            try {
                setQuotesLoading(true)
                setQuoteError(null)
                const results = await Promise.allSettled(
                    quoteCandidates.map(async (invoice) => {
                        const quote = await quoteAdvance({ invoiceId: invoice.id })
                        return [invoice.id, quote] as const
                    }),
                )

                if (!active) return

                const nextQuotes: Record<string, AdvanceQuote> = {}
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        const [invoiceId, quote] = result.value
                        nextQuotes[invoiceId] = quote
                    }
                })

                setQuotesByInvoice(nextQuotes)

                if (results.some((result) => result.status === 'rejected')) {
                    setQuoteError('Some invoices could not be quoted right now.')
                }
            } finally {
                if (active) setQuotesLoading(false)
            }
        }

        loadQuotes()

        return () => {
            active = false
        }
    }, [openInvoices, quoteAdvance])

    const total = openInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const quotableInvoices = openInvoices.filter(canRequestAdvance)
    const eligibleQuotes = quotableInvoices
        .map((invoice) => quotesByInvoice[invoice.id])
        .filter((quote): quote is AdvanceQuote => Boolean(quote?.isEligible))
    const firstEligibleInvoice = quotableInvoices.find((invoice) => quotesByInvoice[invoice.id]?.isEligible)
    const potentialAdvance = eligibleQuotes.reduce((sum, quote) => sum + quote.advanceAmount, 0)
    const estimatedFees = eligibleQuotes.reduce((sum, quote) => sum + quote.feeAmount, 0)
    const waitingLaterInvoices = openInvoices.filter((invoice) =>
        !canRequestAdvance(invoice) && !invoice.advanceRequestId && invoice.status !== 'Draft')
    const waitingLater = waitingLaterInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const draftInvoices = openInvoices.filter((invoice) => invoice.status === 'Draft')
    const next30 = openInvoices
        .filter((invoice) => daysUntilDate(invoice.dueDate) <= 30)
        .reduce((sum, invoice) => sum + invoice.amount, 0)
    const cashByWeek = buildCashByWeek(openInvoices)
    const model = user?.accountType === 'Freelancer' ? 'Discounting' : 'Factoring'
    const modelSub = user?.accountType === 'Freelancer'
        ? 'Private client relationship'
        : 'Client confirmation required'

    return (
        <>
            <PageHeading title="Cash-flow forecast" description="See open receivables, expected payment timing, and advance options from live invoice data." />

            {(invoicesError || quoteError) && (
                <p className="error-text mb-18">{invoicesError ?? quoteError}</p>
            )}

            <section className="cash-action-grid">
                <CashActionCard
                    label="Available now"
                    value={formatCurrency(potentialAdvance)}
                    description={quotesLoading ? 'Checking submitted invoices for advance options.' : `${eligibleQuotes.length} invoice${eligibleQuotes.length === 1 ? '' : 's'} can be advanced now.`}
                    buttonLabel={firstEligibleInvoice ? 'Review quote' : 'Open invoices'}
                    tone="primary"
                    disabled={quotesLoading}
                    onClick={() => navigate(firstEligibleInvoice ? `/invoices/${firstEligibleInvoice.id}/advance` : '/invoices')}
                />
                <CashActionCard
                    label="Waiting later"
                    value={formatCurrency(waitingLater)}
                    description={`${waitingLaterInvoices.length} open invoice${waitingLaterInvoices.length === 1 ? '' : 's'} not currently ready for advance.`}
                    buttonLabel="Review receivables"
                    tone="default"
                    onClick={() => navigate('/invoices')}
                />
                <CashActionCard
                    label="Needs action"
                    value={`${draftInvoices.length + quotableInvoices.length}`}
                    description={`${draftInvoices.length} draft${draftInvoices.length === 1 ? '' : 's'} and ${quotableInvoices.length} submitted invoice${quotableInvoices.length === 1 ? '' : 's'} need attention.`}
                    buttonLabel={draftInvoices[0] ? 'Continue draft' : 'Open invoice center'}
                    tone={draftInvoices.length > 0 ? 'warning' : 'default'}
                    onClick={() => navigate(draftInvoices[0] ? `/invoices/${draftInvoices[0].id}` : '/invoices')}
                />
            </section>

            <section className="stat-grid">
                <StatCard tone="gold" label="Forecasted receivables" value={formatCurrency(total)} sub={`${openInvoices.length} open invoices`} />
                <StatCard
                    tone="green"
                    label="Available now"
                    value={formatCurrency(potentialAdvance)}
                    sub={quotesLoading ? 'Checking backend quotes' : `${eligibleQuotes.length} eligible invoices`}
                />
                <StatCard tone="amber" label="Estimated fees" value={formatCurrency(estimatedFees)} sub="Based on eligible submitted invoices" />
                <StatCard tone="blue" label="Current model" value={model} sub={modelSub} />
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
                {invoicesLoading ? (
                    <EmptyPanel title="Loading forecast" description="Fetching your invoices and advance quotes." />
                ) : openInvoices.length === 0 ? (
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
                            {openInvoices.map((invoice) => {
                                const quote = quotesByInvoice[invoice.id]
                                const advance = invoice.advanceRequestId
                                    ? advancesByInvoice[invoice.id]
                                    : undefined
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
                                            <strong>{quoteSummary(invoice, quote, advance, invoice.currency)}</strong>
                                        </div>
                                        <div className="forecast-action">
                                            {(() => {
                                                const action = getInvoiceAction(invoice, quote, advance, quotesLoading)
                                                return (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        disabled={action.disabled}
                                                        onClick={() => navigate(action.target)}
                                                    >
                                                        {action.label}
                                                    </button>
                                                )
                                            })()}
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
