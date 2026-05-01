import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdvanceQuote, Invoice } from '../types'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useInvoices, useAdvances } from '../hooks'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

function canQuoteInvoice(invoice: Invoice) {
    return !['Paid', 'Rejected', 'Cancelled'].includes(invoice.status)
}

function canRequestAdvance(invoice: Invoice) {
    return invoice.status === 'Submitted' && !invoice.advanceRequestId
}

function VerificationChecklist({
    invoice,
    quote,
}: {
    invoice: Invoice
    quote: AdvanceQuote | null
}) {
    const evidenceCount = invoice.documentCount ?? invoice.documents.length
    const checks = [
        {
            label: evidenceCount > 0
                ? `Optional evidence added (${evidenceCount} file${evidenceCount === 1 ? '' : 's'})`
                : 'Optional evidence can be added later',
            ok: true,
        },
        quote
            ? {
                label: `Requested advance within ${formatCurrency(quote.maxEligibleInvoiceAmount, invoice.currency)} funding limit`,
                ok: quote.advanceAmount <= quote.maxEligibleInvoiceAmount,
            }
            : { label: 'Advance quote available after invoice review', ok: canQuoteInvoice(invoice) },
        quote
            ? { label: 'Due date is inside the eligible window', ok: quote.isEligible }
            : { label: 'Invoice can be quoted from its current status', ok: canQuoteInvoice(invoice) },
        quote
            ? {
                label: quote.financingModel === 'InvoiceFactoring'
                    ? 'Client confirmation required for factoring'
                    : 'Client notification skipped for discounting',
                ok: true,
            }
            : { label: 'Backend quote not loaded yet', ok: false },
    ]

    return (
        <div className="verification-list mt-16">
            {checks.map((check) => (
                <div key={check.label} className={`verification-item ${check.ok ? 'ok' : 'bad'}`}>
                    <span>{check.ok ? 'OK' : 'Check'}</span>
                    <p>{check.label}</p>
                </div>
            ))}
        </div>
    )
}

export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { get: getInvoice, addDocument: addInvoiceDocument, submit: submitInvoice } = useInvoices()
    const { quote: quoteAdvance } = useAdvances()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [quote, setQuote] = useState<AdvanceQuote | null>(null)
    const [quoteError, setQuoteError] = useState('')
    const [quoteLoading, setQuoteLoading] = useState(false)
    const [actionError, setActionError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        let active = true

        const load = async () => {
            if (!id) return

            try {
                const res = await getInvoice(id)
                if (active) setInvoice(res ?? null)
            } catch (err: any) {
                if (active) setActionError(err.message || 'Could not load invoice.')
            }
        }

        load()

        return () => {
            active = false
        }
    }, [id, getInvoice])

    useEffect(() => {
        let active = true

        const loadQuote = async () => {
            if (!invoice || !canQuoteInvoice(invoice)) {
                setQuote(null)
                setQuoteError('')
                return
            }

            try {
                setQuoteLoading(true)
                setQuoteError('')
                const quoteData = await quoteAdvance({ invoiceId: invoice.id })
                if (active) setQuote(quoteData)
            } catch (err: any) {
                if (active) {
                    setQuote(null)
                    setQuoteError(err.message || 'Could not load advance quote.')
                }
            } finally {
                if (active) setQuoteLoading(false)
            }
        }

        loadQuote()

        return () => {
            active = false
        }
    }, [invoice, quoteAdvance])

    const addDocument = async () => {
        if (!invoice || actionLoading) return
        setActionError('')
        setActionLoading(true)
        try {
            const document = await addInvoiceDocument(invoice.id, {
                fileName: `${invoice.invoiceNumber}-evidence-${invoice.documents.length + 1}.pdf`,
                documentType: 'Supporting Evidence',
            })
            setInvoice({
                ...invoice,
                documents: [...invoice.documents, document],
                documentCount: (invoice.documentCount ?? invoice.documents.length) + 1,
            })
        } catch (err: any) {
            setActionError(err.message || 'Could not add evidence.')
        } finally {
            setActionLoading(false)
        }
    }

    const submitForReview = async () => {
        if (!invoice || actionLoading) return
        setActionError('')
        setActionLoading(true)
        try {
            const submitted = await submitInvoice(invoice.id)
            setInvoice(submitted)
        } catch (err: any) {
            setActionError(err.message || 'Could not submit invoice.')
        } finally {
            setActionLoading(false)
        }
    }

    if (!invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Invoice not found</h2>
                <p className="soft-text mt-8">The selected invoice does not exist.</p>
                {actionError && <div className="feedback-item error mt-16">{actionError}</div>}
                <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>Back to invoices</button>
            </div>
        )
    }

    const nextAction = (() => {
        if (invoice.advanceRequestId) {
            return {
                tone: 'success',
                title: 'Advance already requested',
                hint: 'Track review, confirmation, funding, and settlement from the advance page.',
                label: 'Open advance',
                icon: 'open' as const,
                disabled: false,
                onClick: () => navigate(`/advances/${invoice.advanceRequestId}`),
            }
        }

        if (invoice.status === 'Draft') {
            return {
                tone: 'warning',
                title: 'Submit invoice first',
                hint: 'Submitting unlocks the backend advance quote and eligibility checks.',
                label: actionLoading ? 'Submitting...' : 'Submit invoice',
                icon: 'advance' as const,
                disabled: actionLoading,
                onClick: submitForReview,
            }
        }

        if (quoteLoading) {
            return {
                tone: 'default',
                title: 'Checking quote',
                hint: 'Hassil is calculating the available advance and flat fee.',
                label: 'Loading quote',
                icon: 'review' as const,
                disabled: true,
                onClick: () => undefined,
            }
        }

        if (quote && !quote.isEligible) {
            return {
                tone: 'primary',
                title: 'Adjust advance amount',
                hint: quote.eligibilityMessages[0] ?? 'Try a lower requested advance amount on the quote page.',
                label: 'Adjust quote',
                icon: 'advance' as const,
                disabled: false,
                onClick: () => navigate(`/invoices/${invoice.id}/advance`),
            }
        }

        if (canRequestAdvance(invoice)) {
            return {
                tone: 'primary',
                title: 'Advance quote ready',
                hint: 'Review the available cash, flat fee, and repayment path.',
                label: 'Request advance',
                icon: 'advance' as const,
                disabled: false,
                onClick: () => navigate(`/invoices/${invoice.id}/advance`),
            }
        }

        return {
            tone: 'default',
            title: 'No action needed',
            hint: `This invoice is currently ${invoice.status}.`,
            label: 'Back to invoices',
            icon: 'back' as const,
            disabled: false,
            onClick: () => navigate('/invoices'),
        }
    })()

    return (
        <>
            <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: invoice.invoiceNumber }]} />
            <PageHeading title="Invoice details" description={`${invoice.invoiceNumber} · ${invoice.client.name}`} />
            <div className="grid-2 wide-left">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Summary</h2>
                        <StatusBadge status={invoice.status} />
                    </div>
                    <DetailGrid
                        items={[
                            ['Client', `${invoice.client.name} · ${invoice.client.email}`],
                            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                            ['Due date', formatDate(invoice.dueDate)],
                            ['Payment terms', invoice.paymentTerms || 'Not specified'],
                        ]}
                    />
                    <DisclosurePanel title="More invoice details">
                        <DetailGrid
                            items={[
                                ['Issue date', formatDate(invoice.issueDate)],
                                ['Receivable source', invoice.receivableSource === 'DirectClientInvoice' ? 'Direct client invoice' : 'Freelance platform payout'],
                                ['Description', invoice.description || 'No description'],
                                ['Fingerprint', invoice.fingerprint || 'Generated by Hassil'],
                            ]}
                        />
                    </DisclosurePanel>
                    {actionError && <div className="feedback-item error mt-16">{actionError}</div>}
                    <div className="mock-upload mt-18">
                        <div className="space-between">
                            <h3>Optional evidence ({invoice.documents.length} file{invoice.documents.length !== 1 ? 's' : ''})</h3>
                        </div>
                        {invoice.documents.map((doc) => (
                            <div key={doc.id} className="detail-item mt-8">
                                <span>{doc.documentType}</span>
                                <strong>{doc.fileName}</strong>
                            </div>
                        ))}
                        <button className="btn btn-secondary full-width mt-12" onClick={addDocument} disabled={actionLoading}>
                            <Icon name="plus" /> {actionLoading ? 'Adding...' : 'Add optional evidence'}
                        </button>
                    </div>
                </div>
                <div className="card card-gold">
                    <h2 className="card-title">Advance option</h2>
                    <div className={`invoice-detail-next-action ${nextAction.tone}`}>
                        <span>Next action</span>
                        <strong>{nextAction.title}</strong>
                        <p>{nextAction.hint}</p>
                        <button
                            className={`btn ${nextAction.tone === 'primary' ? 'btn-primary' : 'btn-secondary'} full-width mt-12`}
                            onClick={nextAction.onClick}
                            disabled={nextAction.disabled}
                        >
                            <Icon name={nextAction.icon} /> {nextAction.label}
                        </button>
                    </div>
                    {quote ? (
                        <>
                            <ModelBadge model={quote.financingModel} />
                            <p className="soft-text mt-12">
                                {quote.financingModel === 'InvoiceFactoring'
                                    ? 'Client confirms the invoice and pays Hassil on the due date.'
                                    : 'Client is not notified. Repayment happens after client payment is received.'}
                            </p>
                            <DetailGrid
                                items={[
                                    ['Advance amount', formatCurrency(quote.advanceAmount, invoice.currency)],
                                    ['Flat fee', formatCurrency(quote.feeAmount, invoice.currency)],
                                    ['Requested percent', `${(quote.requestedPercent * 100).toFixed(0)}%`],
                                    ['Eligibility', quote.isEligible ? 'Eligible' : 'Needs attention'],
                                ]}
                            />
                        </>
                    ) : (
                        <p className="soft-text mt-12">
                            {quoteLoading ? 'Loading backend quote...' : 'Advance quote is not available for this invoice state.'}
                        </p>
                    )}
                    <VerificationChecklist invoice={invoice} quote={quote} />
                    {quoteError && <div className="feedback-item warning mt-16">{quoteError}</div>}
                    {/*{quote?.eligibilityMessages.length ? (*/}
                    {/*    <div className="risk-flags mt-16">*/}
                    {/*        {quote.eligibilityMessages.map((message) => (*/}
                    {/*            <div key={message} className="risk-flag-item">{message}</div>*/}
                    {/*        ))}*/}
                    {/*    </div>*/}
                    {/*) : null}*/}
                </div>
            </div>
        </>
    )
}
