import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceRequest, Invoice } from '../types'
import {
    generateId,
    formatCurrency,
    scoreAdvance,
    getReviewFlags,
} from '../data/mockApi'
import { useAuth, useInvoices, useAdvances } from '../hooks'
import PageHeading from '../components/PageHeading'
import ModelBadge from '../components/ModelBadge'
import ReviewScore from '../components/ReviewScore'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

function QuoteItem({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'green' }) {
    return (
        <div>
            <div className="quote-item-label">{label}</div>
            <div className={`quote-item-value ${tone ?? ''}`}>{value}</div>
        </div>
    )
}

export default function InvoiceAdvance() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const { get: getInvoice, update: updateInvoice } = useInvoices()
    const { create: createAdvance, getQuote } = useAdvances()

    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [quote, setQuote] = useState<any>(null)
    const [accepted, setAccepted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            getInvoice(id).then((res) => {
                setInvoice(res ?? null)
                if (res) {
                    getQuote(res.id)
                        .then(q => setQuote(q))
                        .catch(err => setError(err.message || 'Failed to calculate quote'))
                } else {
                    setError('Invoice not found')
                }
            }).catch(err => setError(err.message || 'Failed to load invoice'))
        }
    }, [id, getInvoice, getQuote])

    if (error || !invoice || !quote) {
        return (
            <div className="card">
                <h2 className="card-title">
                    {error ? error : !invoice ? 'Invoice not found' : 'Calculating quote...'}
                </h2>
                {(error || !invoice) && <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>Back to invoices</button>}
            </div>
        )
    }
    const actualUser = currentUser || { id: 'user-0', name: 'Demo User' } as any
    const duplicate = false
    const score = scoreAdvance(actualUser, invoice, (invoice.documents?.length ?? 0) > 0, duplicate)
    const flags = getReviewFlags(actualUser, invoice, score)

    const submit = async () => {
        if (!accepted || submitting) return
        setSubmitting(true)
        const advanceId = generateId('adv')
        const advance: Partial<AdvanceRequest> = {
            id: advanceId,
            invoiceId: invoice.id,
            financingModel: quote.financingModel,
            repaymentParty: quote.repaymentParty,
            clientNotificationRequired: quote.clientNotificationRequired,
            requestedPercent: quote.requestedPercent,
            advanceAmount: quote.advanceAmount,
            feeRate: quote.feeRate,
            feeAmount: quote.feeAmount,
            settlementBufferAmount: quote.settlementBufferAmount,
            expectedRepaymentAmount: quote.expectedRepaymentAmount,
            reviewScore: score,
            approvalMode: score >= 75 ? 'Auto' : 'Manual',
            status: score >= 75 ? 'Approved' : 'PendingReview',
            termsAcceptedAt: new Date().toISOString(),
        }
        await createAdvance(advance as AdvanceRequest)
        await updateInvoice(invoice.id, { advanceRequestId: advanceId, status: advance.status === 'Approved' ? 'Approved' : 'PendingReview' })
        navigate(`/advances/${advanceId}`)
    }

    return (
        <>
            <Breadcrumbs
                items={[
                    { label: 'Invoices', onClick: () => navigate('/invoices') },
                    { label: invoice.invoiceNumber, onClick: () => navigate(`/invoices/${invoice.id}`) },
                    { label: 'Advance quote' },
                ]}
            />
            <PageHeading title="Advance quote" description="Review the amount, fee, repayment path, and checks before submitting." />
            <div className="grid-2 wide-left">
                <div>
                    <div className="quote-box">
                        <div className="card-header">
                            <h2 className="card-title">Advance proposal</h2>
                            <ModelBadge model={quote.financingModel} />
                        </div>
                        <div className="quote-grid">
                            <QuoteItem label="Invoice amount" value={formatCurrency(invoice.amount, invoice.currency)} />
                            <QuoteItem label="Advance" value={formatCurrency(quote.advanceAmount, invoice.currency)} tone="gold" />
                            <QuoteItem label="Flat fee" value={formatCurrency(quote.feeAmount, invoice.currency)} />
                            <QuoteItem label="Repayment / settlement" value={formatCurrency(quote.expectedRepaymentAmount, invoice.currency)} tone="green" />
                            <QuoteItem label="Settlement buffer" value={formatCurrency(quote.settlementBufferAmount, invoice.currency)} />
                            <QuoteItem label="Fee rate" value={`${(quote.feeRate * 100).toFixed(1)}%`} />
                        </div>
                        <div className="quote-disclaimer">
                            Fixed upfront fee.{' '}
                            {quote.clientNotificationRequired ? 'Client confirmation is required.' : 'Client is not notified.'}
                        </div>
                    </div>
                    <div className="card mt-24">
                        <h2 className="card-title">Terms</h2>
                        <p className="soft-text mt-8">The fee is fixed upfront and shown before submission.</p>
                        <label className="checkbox-row mt-16">
                            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                            <span>I accept the advance terms shown above.</span>
                        </label>
                        <button
                            className="btn btn-primary full-width mt-16"
                            onClick={submit}
                            disabled={!accepted || submitting}
                        >
                            <Icon name="advance" /> Submit Advance Request
                        </button>
                    </div>
                </div>
                <div className="card card-gold">
                    <h2 className="card-title">Checks</h2>
                    <div className="verification-list mt-16">
                        {[
                            { label: 'Supporting document attached', ok: (invoice.documents?.length ?? 0) > 0 },
                            { label: `Amount within ${formatCurrency(quote.maxEligibleInvoiceAmount, invoice.currency)} limit`, ok: invoice.amount <= quote.maxEligibleInvoiceAmount },
                            { label: 'Due date is in the future', ok: new Date(invoice.dueDate).getTime() > Date.now() },
                        ].map((check) => (
                            <div key={check.label} className={`verification-item ${check.ok ? 'ok' : 'bad'}`}>
                                <span>{check.ok ? 'OK' : 'Check'}</span>
                                <p>{check.label}</p>
                            </div>
                        ))}
                    </div>
                    <ReviewScore score={score} flags={flags} />
                </div>
            </div>
        </>
    )
}
