import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceQuote, Invoice } from '../types'
import { daysUntilDate, formatCurrency } from '../utils/formatters'
import { useInvoices, useAdvances } from '../hooks'
import PageHeading from '../components/PageHeading'
import ModelBadge from '../components/ModelBadge'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

const TERMS_VERSION = 'hackathon-v1'

function moneyInputValue(amount: number) {
    return amount.toFixed(2).replace(/\.00$/, '')
}

function QuoteItem({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'green' }) {
    return (
        <div>
            <div className="quote-item-label">{label}</div>
            <div className={`quote-item-value ${tone ?? ''}`}>{value}</div>
        </div>
    )
}

function QuoteLoadingState({ onBack }: { onBack: () => void }) {
    return (
        <>
            <Breadcrumbs items={[{ label: 'Invoices', onClick: onBack }, { label: 'Advance quote' }]} />
            <PageHeading
                title="Preparing your advance quote"
                description="Checking invoice amount, due date, account type, and trust limits."
            />
            <div className="quote-loading-card">
                <div className="quote-loading-icon">
                    <Icon name="advance" />
                </div>
                <div>
                    <h2 className="card-title">Building the proposal</h2>
                    <p className="soft-text mt-8">
                        Hassil is calculating the amount available now, the flat fee, and the repayment path.
                    </p>
                    <div className="quote-loading-steps mt-18">
                        {['Invoice details', 'Trust limits', 'Fee and settlement'].map((step) => (
                            <div className="quote-loading-step" key={step}>
                                <span />
                                <p>{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

export default function InvoiceAdvance() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { get: getInvoice, refetch: refetchInvoices } = useInvoices()
    const { quote: quoteAdvance, create: createAdvance } = useAdvances()

    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [quote, setQuote] = useState<AdvanceQuote | null>(null)
    const [requestedAmount, setRequestedAmount] = useState('')
    const [accepted, setAccepted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [quoteUpdating, setQuoteUpdating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadQuote = useCallback(async (isCurrent: () => boolean = () => true) => {
        if (!id) {
            setLoading(false)
            setError('Invoice id is missing.')
            return
        }

        try {
            setLoading(true)
            setError(null)
            setQuote(null)

            const invData = await getInvoice(id)
            if (!isCurrent()) return

            setInvoice(invData ?? null)
            if (!invData) {
                setError('We could not find this invoice.')
                return
            }

            const quoteData = await quoteAdvance({ invoiceId: invData.id })
            if (!isCurrent()) return

            setQuote(quoteData)
            setRequestedAmount(moneyInputValue(quoteData.advanceAmount))
        } catch (err: any) {
            if (isCurrent()) setError(err.message || 'Failed to load advance quote.')
        } finally {
            if (isCurrent()) setLoading(false)
        }
    }, [id, getInvoice, quoteAdvance])

    useEffect(() => {
        let active = true

        loadQuote(() => active)

        return () => {
            active = false
        }
    }, [loadQuote])

    const updateQuote = async (amountOverride?: number) => {
        if (!invoice || !quote || quoteUpdating) return

        const amount = amountOverride ?? Number(requestedAmount)
        const maxPercentAmount = invoice.amount * quote.maxAdvancePercent

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Enter a requested advance amount greater than zero.')
            return
        }

        if (amount > maxPercentAmount) {
            setError(`The maximum advance percentage allows up to ${formatCurrency(maxPercentAmount, invoice.currency)} for this invoice.`)
            return
        }

        try {
            setQuoteUpdating(true)
            setError(null)
            setAccepted(false)
            const nextQuote = await quoteAdvance({
                invoiceId: invoice.id,
                requestedPercent: amount / invoice.amount,
            })
            setQuote(nextQuote)
            setRequestedAmount(moneyInputValue(nextQuote.advanceAmount))
        } catch (err: any) {
            setError(err.message || 'Could not update the advance quote.')
        } finally {
            setQuoteUpdating(false)
        }
    }

    const submit = async () => {
        if (!invoice || !quote || !accepted || submitting || !quote.isEligible) return

        try {
            setSubmitting(true)
            setError(null)

            const advance = await createAdvance({
                invoiceId: invoice.id,
                requestedPercent: quote.requestedPercent,
                termsAccepted: accepted,
                termsVersion: TERMS_VERSION,
            })

            await refetchInvoices()
            navigate(`/advances/${advance.id}`)
        } catch (err: any) {
            setError(err.message || 'Failed to submit advance request')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <QuoteLoadingState onBack={() => navigate('/invoices')} />
    }

    if (!invoice || !quote) {
        const title = invoice ? 'Quote could not load' : 'Invoice not found'
        const description = error ?? (invoice
            ? 'The invoice loaded, but Hassil could not calculate the quote.'
            : 'The selected invoice does not exist or is no longer available.')

        return (
            <>
                <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: 'Advance quote' }]} />
                <PageHeading title={title} description={description} />
                <div className="card quote-empty-state">
                    <div className="quote-loading-icon muted">
                        <Icon name="advance" />
                    </div>
                    <div>
                        <h2 className="card-title">{title}</h2>
                        <p className="soft-text mt-8">{description}</p>
                        <div className="quote-empty-actions mt-18">
                            {invoice && (
                                <button className="btn btn-primary" onClick={() => loadQuote()}>
                                    <Icon name="next" /> Try again
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
                                Back to invoices
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const evidenceCount = invoice.documentCount ?? invoice.documents.length
    const daysUntilDue = daysUntilDate(invoice.dueDate)
    const dueDateEligible = daysUntilDue >= 0 && daysUntilDue <= 90
    const fundingLimitEligible = quote.advanceAmount <= quote.maxEligibleInvoiceAmount
    const maxRequestedAdvance = Math.min(invoice.amount * quote.maxAdvancePercent, quote.maxEligibleInvoiceAmount)
    const amountMatchesQuote = Math.abs(Number(requestedAmount) - quote.advanceAmount) < 0.01
    const canSubmit = quote.isEligible && invoice.status === 'Submitted' && amountMatchesQuote
    const requestPercentLabel = `${(quote.requestedPercent * 100).toFixed(0)}% requested`
    const submitHint = !amountMatchesQuote
        ? 'Update the quote after changing the requested amount.'
        : !quote.isEligible
            ? 'Adjust the requested advance amount or resolve the eligibility checks before submitting.'
            : invoice.status !== 'Submitted'
                ? 'Submit the invoice first, then return to request the advance.'
                : accepted
                    ? 'Ready to send this request for review.'
                    : 'Accept the terms to continue.'

    return (
        <>
            <Breadcrumbs
                items={[
                    { label: 'Invoices', onClick: () => navigate('/invoices') },
                    { label: invoice.invoiceNumber, onClick: () => navigate(`/invoices/${invoice.id}`) },
                    { label: 'Advance quote' },
                ]}
            />
            <PageHeading title="Advance quote" description="Review the amount, flat fee, and repayment path before submitting." />
            <>
                    <div className="quote-box quote-box-highlight">
                        <div className="card-header">
                            <h2 className="card-title">Advance proposal</h2>
                            <div className="quote-header-actions">
                                <span className={`quote-pill ${quote.isEligible ? 'success' : 'warning'}`}>
                                    {quote.isEligible ? 'Eligible quote' : 'Needs attention'}
                                </span>
                                <ModelBadge model={quote.financingModel} />
                            </div>
                        </div>
                        <div className="quote-hero">
                            <div>
                                <span className="quote-hero-label">Available now</span>
                                <strong>{formatCurrency(quote.advanceAmount, invoice.currency)}</strong>
                                <p>
                                    From {invoice.invoiceNumber}, with a fixed {formatCurrency(quote.feeAmount, invoice.currency)} fee.
                                </p>
                            </div>
                            <div className="quote-hero-side">
                                <span>{requestPercentLabel}</span>
                                <strong>{formatCurrency(invoice.amount, invoice.currency)}</strong>
                                <p>invoice value</p>
                            </div>
                        </div>
                        <div className="quote-grid">
                            <QuoteItem label="Flat fee" value={formatCurrency(quote.feeAmount, invoice.currency)} />
                            <QuoteItem label="Repayment / settlement" value={formatCurrency(quote.expectedRepaymentAmount, invoice.currency)} tone="green" />
                            <QuoteItem label="Settlement buffer" value={formatCurrency(quote.settlementBufferAmount, invoice.currency)} />
                            <QuoteItem label="Fee rate" value={`${(quote.feeRate * 100).toFixed(1)}%`} />
                        </div>
                        <div className="quote-disclaimer">
                            {requestPercentLabel}.{' '}
                            {quote.clientNotificationRequired
                                ? 'Client confirmation is required and the client pays through Hassil.'
                                : 'Your client relationship stays private and you repay after collection.'}
                        </div>
                    </div>

                    <div className="card quote-adjust-card mt-24">
                        <div>
                            <h2 className="card-title">Adjust requested advance</h2>
                            <p className="soft-text mt-8">
                                Your current funding limit is {formatCurrency(quote.maxEligibleInvoiceAmount, invoice.currency)}. Try a smaller amount and Hassil will recalculate the quote.
                            </p>
                        </div>
                        <div className="quote-adjust-controls">
                            <div className="form-group">
                                <label>Requested advance amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={invoice.amount}
                                    step="1"
                                    value={requestedAmount}
                                    onChange={(event) => {
                                        setRequestedAmount(event.target.value)
                                        setAccepted(false)
                                    }}
                                />
                            </div>
                            <div className="quote-adjust-actions">
                                {!fundingLimitEligible && (
                                    <button
                                        className="btn btn-secondary"
                                        type="button"
                                        onClick={() => updateQuote(maxRequestedAdvance)}
                                        disabled={quoteUpdating}
                                    >
                                        Use {formatCurrency(maxRequestedAdvance, invoice.currency)}
                                    </button>
                                )}
                                <button className="btn btn-primary" type="button" onClick={() => updateQuote()} disabled={quoteUpdating}>
                                    <Icon name="advance" /> {quoteUpdating ? 'Updating...' : 'Update quote'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card quote-action-card mt-24">
                        <h2 className="card-title">Terms</h2>
                        <p className="soft-text mt-8">
                            The fee is fixed upfront. Hassil only moves forward after you accept this quote.
                        </p>
                        <div className={`quote-next-step mt-16 ${canSubmit && accepted ? 'ready' : ''}`}>
                            <Icon name={canSubmit && accepted ? 'check' : 'review'} />
                            <span>{submitHint}</span>
                        </div>
                        {invoice.status !== 'Submitted' && (
                            <div className="quote-disclaimer mt-16">
                                Submit this invoice first before requesting an advance.
                            </div>
                        )}
                        {error && <p className="error-text mt-16">{error}</p>}
                        <label className="checkbox-row mt-16">
                            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                            <span>I accept the advance terms shown above.</span>
                        </label>
                        <button
                            className="btn btn-primary full-width mt-16"
                            onClick={submit}
                            disabled={!accepted || submitting || !canSubmit}
                        >
                            <Icon name="advance" /> {submitting ? 'Submitting request...' : 'Submit advance request'}
                        </button>
                    </div>
            </>
        </>
    )
}
