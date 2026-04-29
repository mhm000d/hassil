import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice } from '../types'
import {
    mockUsers,
    generateId,
    formatCurrency,
    daysUntilDate,
    calculateQuote,
} from '../data/mockApi'
import { useAuth } from '../hooks'
import { InvoiceService } from '../services/invoiceService'
import PageHeading from '../components/PageHeading'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

function createFingerprint(invoiceNumber: string, clientEmail: string, amount: number, dueDate: string, source: string) {
    return `${invoiceNumber}-${clientEmail}-${amount}-${dueDate}-${source}`
}

export default function NewInvoice() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const actualUser = currentUser || mockUsers[0]
    
    const [form, setForm] = useState({
        clientName: 'Noura Retail Group',
        clientEmail: 'ap@nouraretail.sa',
        clientCountry: 'Saudi Arabia',
        invoiceNumber: `AHM-2026-${Math.floor(100 + Math.random() * 200)}`,
        receivableSource: 'DirectClientInvoice' as Invoice['receivableSource'],
        amount: 16000,
        currency: 'USD',
        issueDate: '2026-04-28',
        dueDate: '2026-06-12',
        description: 'Campaign assets delivered and approved by client.',
        paymentTerms: 'Net 45',
        hasEvidence: true,
    })

    const fingerprint = createFingerprint(form.invoiceNumber, form.clientEmail, Number(form.amount) || 0, form.dueDate, form.receivableSource)
    const quote = calculateQuote(actualUser, { ...form, id: '', userId: '', clientId: '', client: { id: '', name: form.clientName, email: form.clientEmail }, status: 'Submitted', fingerprint, createdAt: '', documents: [] } as Invoice)
    const dueDays = daysUntilDate(form.dueDate)

    const errors = [
        Number(form.amount) <= 0 ? 'Amount must be greater than zero.' : '',
        new Date(form.dueDate).getTime() <= new Date(form.issueDate).getTime() ? 'Due date must be after the issue date.' : '',
        dueDays < 0 ? 'Due date cannot be in the past.' : '',
        !form.hasEvidence ? 'Attach invoice evidence before submitting.' : '',
    ].filter(Boolean) as string[]

    const warnings = [
        Number(form.amount) > quote.maxEligibleInvoiceAmount * 0.85
            ? `Amount is close to the ${formatCurrency(quote.maxEligibleInvoiceAmount, form.currency)} limit.`
            : '',
        dueDays > 75 ? 'Long payment terms may require extra review.' : '',
    ].filter(Boolean) as string[]

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        if (errors.length > 0) return

        const invoiceId = generateId('inv')
        const invoice: Partial<Invoice> = {
            id: invoiceId,
            clientId: generateId('client'),
            client: { id: '', name: form.clientName, email: form.clientEmail, country: form.clientCountry },
            invoiceNumber: form.invoiceNumber,
            receivableSource: form.receivableSource,
            amount: Number(form.amount),
            currency: form.currency,
            issueDate: form.issueDate,
            dueDate: form.dueDate,
            description: form.description,
            paymentTerms: form.paymentTerms,
            status: 'Submitted',
            fingerprint,
        }
        await InvoiceService.create(invoice as Invoice)
        navigate(`/invoices/${invoiceId}`)
    }

    return (
        <>
            <PageHeading title="Create invoice" description="Enter invoice details and attach evidence for review." />
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
                    <span>Invoice evidence is attached.</span>
                </label>
                {(errors.length > 0 || warnings.length > 0) && (
                    <div className="feedback-list mb-18">
                        {errors.map((err) => <div className="feedback-item error" key={err}>{err}</div>)}
                        {warnings.map((w) => <div className="feedback-item warning" key={w}>{w}</div>)}
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate('/invoices')}>Cancel</button>
                    <button className="btn btn-primary" type="submit" disabled={errors.length > 0}>
                        <Icon name="plus" /> Create Invoice
                    </button>
                </div>
            </form>
        </>
    )
}
