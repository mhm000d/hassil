import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Invoice, User } from '../types'
import { mockApi, mockUsers, generateId, formatCurrency, formatDate, calculateQuote } from '../data/mockApi'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'

const currentUser: User = mockUsers[0]

function VerificationChecklist({ invoice, quote }: { invoice: Invoice; quote: ReturnType<typeof calculateQuote> }) {
    const checks = [
        { label: 'Supporting document attached', ok: invoice.documents.length > 0 },
        { label: `Invoice amount within ${formatCurrency(quote.maxEligibleInvoiceAmount, invoice.currency)} limit`, ok: invoice.amount <= quote.maxEligibleInvoiceAmount },
        { label: 'Due date is inside the eligible window', ok: new Date(invoice.dueDate).getTime() > Date.now() },
        {
            label: quote.financingModel === 'InvoiceFactoring'
                ? 'Client confirmation required for factoring'
                : 'Client notification skipped for discounting',
            ok: true,
        },
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
    const [invoice, setInvoice] = useState<Invoice | null>(null)

    useEffect(() => {
        if (id) mockApi.getInvoice(id).then((res) => setInvoice(res.data ?? null))
    }, [id])

    const addDocument = async () => {
        if (!invoice) return
        const doc = {
            id: generateId('doc'),
            invoiceId: invoice.id,
            fileName: 'additional-evidence.pdf',
            documentType: 'Supporting Evidence',
            uploadedAt: new Date().toISOString(),
        }
        const updated = { ...invoice, documents: [...invoice.documents, doc] }
        await mockApi.updateInvoice(invoice.id, { documents: updated.documents })
        setInvoice(updated)
    }

    if (!invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Invoice not found</h2>
                <p className="soft-text mt-8">The selected invoice does not exist.</p>
                <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>Back to invoices</button>
            </div>
        )
    }

    const quote = calculateQuote(currentUser, invoice)

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
                                ['Fingerprint', invoice.fingerprint],
                            ]}
                        />
                    </DisclosurePanel>
                    <div className="mock-upload mt-18">
                        <div className="space-between">
                            <h3>Evidence ({invoice.documents.length} file{invoice.documents.length !== 1 ? 's' : ''})</h3>
                        </div>
                        {invoice.documents.map((doc) => (
                            <div key={doc.id} className="detail-item mt-8">
                                <span>{doc.documentType}</span>
                                <strong>{doc.fileName}</strong>
                            </div>
                        ))}
                        <button className="btn btn-secondary full-width mt-12" onClick={addDocument}>
                            <Icon name="plus" /> Add evidence
                        </button>
                    </div>
                </div>
                <div className="card card-gold">
                    <h2 className="card-title">Advance option</h2>
                    <ModelBadge model={quote.financingModel} />
                    <p className="soft-text mt-12">
                        {quote.financingModel === 'InvoiceFactoring'
                            ? 'Client confirms the invoice and pays Hassil on the due date.'
                            : 'Client is not notified. Repayment happens after client payment is received.'}
                    </p>
                    <VerificationChecklist invoice={invoice} quote={quote} />
                    <div className="form-actions stacked mt-16">
                        {invoice.advanceRequestId ? (
                            <button className="btn btn-primary full-width" onClick={() => navigate(`/advances/${invoice.advanceRequestId}`)}>
                                <Icon name="open" /> Open Advance
                            </button>
                        ) : (
                            <button className="btn btn-primary full-width" onClick={() => navigate(`/invoices/${invoice.id}/advance`)}>
                                <Icon name="advance" /> Request Advance
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
