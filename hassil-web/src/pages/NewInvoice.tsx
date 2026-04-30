import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice } from '../types'
import { daysUntilDate, formatCurrency, formatDate } from '../utils/formatters'
import { useInvoices } from '../hooks'
import PageHeading from '../components/PageHeading'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

function dateInputValue(daysFromToday: number) {
    const date = new Date()
    date.setDate(date.getDate() + daysFromToday)
    return date.toISOString().slice(0, 10)
}

function uniqueInvoiceToken() {
    const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    return `${Date.now().toString(36)}${random}`.toUpperCase()
}

function buildStarterInvoiceForm() {
    const token = uniqueInvoiceToken()
    return {
        clientName: 'Noura Retail Group',
        clientEmail: `ap.${token.toLowerCase()}@nouraretail.sa`,
        clientCountry: 'Saudi Arabia',
        invoiceNumber: `AHM-${token.slice(-8)}`,
        receivableSource: 'DirectClientInvoice' as Invoice['receivableSource'],
        amount: 16000,
        currency: 'USD',
        issueDate: dateInputValue(0),
        dueDate: dateInputValue(45),
        description: 'Campaign assets delivered and approved by client.',
        paymentTerms: 'Net 45',
        hasEvidence: false,
    }
}

function InvoiceFlowSteps({
    submitted,
    evidenceReady,
}: {
    submitted: boolean
    evidenceReady: boolean
}) {
    const steps = [
        { label: 'Invoice details', state: submitted ? 'done' : 'active' },
        { label: 'Evidence optional', state: submitted || evidenceReady ? 'done' : 'pending' },
        { label: 'Submit', state: submitted ? 'done' : 'pending' },
    ]

    return (
        <div className="invoice-flow-steps">
            {steps.map((step, index) => (
                <div key={step.label} className={`invoice-flow-step ${step.state}`}>
                    <span>{index + 1}</span>
                    <p>{step.label}</p>
                </div>
            ))}
        </div>
    )
}

export default function NewInvoice() {
    const navigate = useNavigate()
    const { create, addDocument, submit: submitInvoice } = useInvoices()
    const [submitError, setSubmitError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null)
    const [form, setForm] = useState(buildStarterInvoiceForm)

    const dueDays = daysUntilDate(form.dueDate)

    const errors = [
        Number(form.amount) <= 0 ? 'Amount must be greater than zero.' : '',
        new Date(form.dueDate).getTime() <= new Date(form.issueDate).getTime() ? 'Due date must be after the issue date.' : '',
        dueDays < 0 ? 'Due date cannot be in the past.' : '',
    ].filter(Boolean) as string[]

    const warnings = [
        dueDays > 75 ? 'Long payment terms may require extra review.' : '',
    ].filter(Boolean) as string[]

    const requiredFieldsReady = Boolean(
        form.invoiceNumber.trim()
        && form.clientName.trim()
        && form.clientEmail.trim()
        && form.issueDate
        && form.dueDate
        && form.currency
        && Number(form.amount) > 0,
    )
    const readyForSubmit = requiredFieldsReady && errors.length === 0

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        setSubmitError('')
        if (!readyForSubmit || submitting) return

        setSubmitting(true)
        try {
            const created = await create({
                clientName: form.clientName,
                clientEmail: form.clientEmail,
                clientCountry: form.clientCountry,
                invoiceNumber: form.invoiceNumber,
                receivableSource: form.receivableSource,
                amount: Number(form.amount),
                currency: form.currency,
                issueDate: form.issueDate,
                dueDate: form.dueDate,
                description: form.description,
                paymentTerms: form.paymentTerms,
            })

            if (form.hasEvidence) {
                await addDocument(created.id, {
                    fileName: `${form.invoiceNumber}-evidence.pdf`,
                    documentType: 'Supporting Evidence',
                })
            }

            const submitted = await submitInvoice(created.id)
            setCreatedInvoice(submitted)
        } catch (err: any) {
            setSubmitError(err.message || 'Could not create invoice.')
        } finally {
            setSubmitting(false)
        }
    }

    const createAnother = () => {
        setCreatedInvoice(null)
        setSubmitError('')
        setSubmitting(false)
        setForm(buildStarterInvoiceForm())
    }

    if (createdInvoice) {
        return (
            <>
                <Breadcrumbs
                    items={[
                        { label: 'Invoices', onClick: () => navigate('/invoices') },
                        { label: 'Create invoice' },
                        { label: 'Submitted' },
                    ]}
                />
                <PageHeading
                    title="Invoice submitted"
                    description="The invoice is ready for an advance quote, or you can keep adding invoices."
                />
                <InvoiceFlowSteps submitted evidenceReady />
                <div className="invoice-success-card">
                    <div className="invoice-success-icon">
                        <Icon name="check" />
                    </div>
                    <div className="invoice-success-body">
                        <div className="card-header">
                            <div>
                                <h2 className="card-title">{createdInvoice.invoiceNumber}</h2>
                                <p className="soft-text mt-8">
                                    {createdInvoice.client.name} · due {formatDate(createdInvoice.dueDate)}
                                </p>
                            </div>
                            <span className="quote-pill success">Submitted</span>
                        </div>
                        <div className="invoice-success-summary">
                            <div>
                                <span>Invoice amount</span>
                                <strong>{formatCurrency(createdInvoice.amount, createdInvoice.currency)}</strong>
                            </div>
                            <div>
                                <span>Optional evidence</span>
                                <strong>{createdInvoice.documentCount ?? createdInvoice.documents.length} file</strong>
                            </div>
                            <div>
                                <span>Next step</span>
                                <strong>Advance quote</strong>
                            </div>
                        </div>
                        <div className="invoice-success-actions">
                            <button className="btn btn-primary" onClick={() => navigate(`/invoices/${createdInvoice.id}/advance`)}>
                                <Icon name="advance" /> Request advance
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate(`/invoices/${createdInvoice.id}`)}>
                                <Icon name="open" /> View invoice
                            </button>
                            <button className="btn btn-ghost" onClick={createAnother}>
                                <Icon name="plus" /> Create another invoice
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <PageHeading title="Create and submit invoice" description="Enter the invoice details once, then move directly to the advance quote." />
            <InvoiceFlowSteps submitted={false} evidenceReady={form.hasEvidence} />
            <form className="card form-card" onSubmit={submit}>
                <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: 'Create invoice' }]} />
                <div className="form-grid-2">
                    <div className="form-group">
                        <label>Invoice number</label>
                        <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Receivable source</label>
                        <select value={form.receivableSource} onChange={(e) => setForm({ ...form, receivableSource: e.target.value as Invoice['receivableSource'] })}>
                            <option value="DirectClientInvoice">Direct client invoice</option>
                            <option value="FreelancePlatformPayout">Freelance platform payout</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Client name</label>
                        <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Client email</label>
                        <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Client country</label>
                        <input value={form.clientCountry} onChange={(e) => setForm({ ...form, clientCountry: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Currency</label>
                        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                            <option>USD</option>
                            <option>AED</option>
                            <option>SAR</option>
                            <option>EGP</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Amount</label>
                        <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group">
                        <label>Issue date</label>
                        <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Due date</label>
                        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Payment terms</label>
                        <input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <label className="checkbox-row mb-18">
                    <input type="checkbox" checked={form.hasEvidence} onChange={(e) => setForm({ ...form, hasEvidence: e.target.checked })} />
                    <span>Attach evidence file (optional).</span>
                </label>
                <p className="soft-text mb-18">
                    You can continue without this. Attach a file only when supporting evidence is available.
                </p>
                {(errors.length > 0 || warnings.length > 0 || submitError) && (
                    <div className="feedback-list mb-18">
                        {submitError && <div className="feedback-item error">{submitError}</div>}
                        {errors.map((err) => <div className="feedback-item error" key={err}>{err}</div>)}
                        {warnings.map((w) => <div className="feedback-item warning" key={w}>{w}</div>)}
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/invoices')}>Back to invoices</button>
                    <button className="btn btn-primary" type="submit" disabled={!readyForSubmit || submitting}>
                        <Icon name="plus" /> {submitting ? 'Submitting...' : 'Create and submit'}
                    </button>
                </div>
            </form>
        </>
    )
}
