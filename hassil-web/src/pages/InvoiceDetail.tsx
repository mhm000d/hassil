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

function canQuoteInvoice(invoice: Invoice) {
    return !['Paid', 'Rejected', 'Cancelled'].includes(invoice.status)
}

function canRequestAdvance(invoice: Invoice) {
    return invoice.status === 'Submitted' && !invoice.advanceRequestId
}



export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { get: getInvoice, addDocument: addInvoiceDocument, submit: submitInvoice } = useInvoices()
    const { quote: quoteAdvance } = useAdvances()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [quote, setQuote] = useState<AdvanceQuote | null>(null)
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
                const quoteData = await quoteAdvance({ invoiceId: invoice.id })
                if (active) setQuote(quoteData)
                if (active) {
                    setQuote(null)
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



    return (
        <>
            <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: invoice.invoiceNumber }]} />
            <PageHeading title="Invoice details" description={`${invoice.invoiceNumber} · ${invoice.client.name}`} />
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
                    {/*<div className="mock-upload mt-18">*/}
                        {/*<div className="space-between">*/}
                        {/*    <h3>Optional evidence ({invoice.documents.length} file{invoice.documents.length !== 1 ? 's' : ''})</h3>*/}
                        {/*</div>*/}
                        {/*{invoice.documents.map((doc) => (*/}
                        {/*    <div key={doc.id} className="detail-item mt-8">*/}
                        {/*        <span>{doc.documentType}</span>*/}
                        {/*        <strong>{doc.fileName}</strong>*/}
                        {/*    </div>*/}
                        {/*))}*/}
                        {/*<button className="btn btn-secondary full-width mt-12" onClick={addDocument} disabled={actionLoading}>*/}
                        {/*    <Icon name="plus" /> {actionLoading ? 'Adding...' : 'Add optional evidence'}*/}
                        {/*</button>*/}
                    {/*</div>*/}
                </div>
                {/*<div className="card card-gold">*/}
                {/*    <h2 className="card-title">Advance option</h2>*/}
                {/*    <div className={`invoice-detail-next-action ${nextAction.tone}`}>*/}
                {/*        <span>Next action</span>*/}
                {/*        <strong>{nextAction.title}</strong>*/}
                {/*        <p>{nextAction.hint}</p>*/}
                {/*        <button*/}
                {/*            className={`btn ${nextAction.tone === 'primary' ? 'btn-primary' : 'btn-secondary'} full-width mt-12`}*/}
                {/*            onClick={nextAction.onClick}*/}
                {/*            disabled={nextAction.disabled}*/}
                {/*        >*/}
                {/*            <Icon name={nextAction.icon} /> {nextAction.label}*/}
                {/*        </button>*/}
                {/*    </div>*/}
                {/*    {quote ? (*/}
                {/*        <>*/}
                {/*            <ModelBadge model={quote.financingModel} />*/}
                {/*            <p className="soft-text mt-12">*/}
                {/*                {quote.financingModel === 'InvoiceFactoring'*/}
                {/*                    ? 'Client confirms the invoice and pays Hassil on the due date.'*/}
                {/*                    : 'Client is not notified. Repayment happens after client payment is received.'}*/}
                {/*            </p>*/}
                {/*            <DetailGrid*/}
                {/*                items={[*/}
                {/*                    ['Advance amount', formatCurrency(quote.advanceAmount, invoice.currency)],*/}
                {/*                    ['Flat fee', formatCurrency(quote.feeAmount, invoice.currency)],*/}
                {/*                    ['Requested percent', `${(quote.requestedPercent * 100).toFixed(0)}%`],*/}
                {/*                    ['Eligibility', quote.isEligible ? 'Eligible' : 'Needs attention'],*/}
                {/*                ]}*/}
                {/*            />*/}
                {/*        </>*/}
                {/*    ) : (*/}
                {/*        <p className="soft-text mt-12">*/}
                {/*            {quoteLoading ? 'Loading backend quote...' : 'Advance quote is not available for this invoice state.'}*/}
                {/*        </p>*/}
                {/*    )}*/}
                {/*    <VerificationChecklist invoice={invoice} quote={quote} />*/}
                {/*    {quoteError && <div className="feedback-item warning mt-16">{quoteError}</div>}*/}
                {/*    /!*{quote?.eligibilityMessages.length ? (*!/*/}
                {/*    /!*    <div className="risk-flags mt-16">*!/*/}
                {/*    /!*        {quote.eligibilityMessages.map((message) => (*!/*/}
                {/*    /!*            <div key={message} className="risk-flag-item">{message}</div>*!/*/}
                {/*    /!*        ))}*!/*/}
                {/*    /!*    </div>*!/*/}
                {/*    /!*) : null}*!/*/}
                {/*</div>*/}
        </>
    )
}
