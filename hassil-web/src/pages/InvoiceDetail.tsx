import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Invoice } from '../types'
import { mockUsers, formatCurrency, formatDate, calculateQuote } from '../data/mockApi'
import { useAuth, useInvoices, useAdvances, useTransactions } from '../hooks'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import Breadcrumbs from '../components/Breadcrumbs'
import Table from '../components/Table'
import TransactionTimeline from '../components/TransactionTimeline'
import Icon from '../components/Icon'

export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const { get: getInvoice, addDocument: addInvoiceDocument, refetch: refetchInvoices } = useInvoices()
    const { advances } = useAdvances()
    const { transactions } = useTransactions()

    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)
    const user = currentUser || mockUsers[0]

    const load = async () => {
        if (id) {
            const res = await getInvoice(id)
            setInvoice(res ?? null)
        }
    }

    useEffect(() => {
        setLoading(true)
        refetchInvoices()
            .then(() => load())
            .finally(() => setLoading(false))
    }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

    const addDocument = async () => {
        if (!invoice) return
        await addInvoiceDocument(invoice.id, {
            fileName: 'additional-evidence.pdf',
            documentType: 'Supporting Evidence',
        })
        await load()
    }

    if (loading) {
        return <div className="loading-state">Loading invoice...</div>
    }

    if (!invoice) {
        return (
            <div className="card">
                <h2 className="card-title">Invoice not found</h2>
                <button className="btn btn-primary mt-16" onClick={() => navigate('/invoices')}>Back to invoices</button>
            </div>
        )
    }

    const quote = calculateQuote(user, invoice)
    const invoiceAdvances = advances.filter(a => a.invoiceId === invoice.id)
    const invoiceTransactions = transactions.filter(tx => tx.invoiceId === invoice.id)

    return (
        <>
            <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: invoice.invoiceNumber }]} />
            <PageHeading title="Invoice details" description={`${invoice.invoiceNumber} · ${invoice.client.name}`} />
            <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' }}>

                {/* ── Left: Summary card ── */}
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
                    <DisclosurePanel title="More invoice details" noDivider>
                        <DetailGrid
                            items={[
                                ['Issue date', formatDate(invoice.issueDate)],
                                ['Receivable source', invoice.receivableSource === 'DirectClientInvoice' ? 'Direct client invoice' : 'Freelance platform payout'],
                                ['Description', invoice.description || 'No description'],
                                ['Fingerprint', invoice.fingerprint],
                            ]}
                        />
                    </DisclosurePanel>

                    {/* Evidence */}
                    <details className="disclosure-panel evidence-panel mt-18" open>
                        <summary>
                            <h2 className="card-title">Evidence ({invoice.documents?.length ?? 0} file{(invoice.documents?.length ?? 0) !== 1 ? 's' : ''})</h2>
                            <Icon name="chevron-down" />
                        </summary>
                        <div className="disclosure-content">
                            {(invoice.documents || []).map((doc) => (
                                <div key={doc.id} className="detail-item mt-8">
                                    <span>{doc.documentType}</span>
                                    <strong>{doc.fileName}</strong>
                                </div>
                            ))}
                            <button className="btn btn-secondary full-width mt-12" onClick={addDocument}>
                                <Icon name="plus" /> Add evidence
                            </button>
                        </div>
                    </details>

                    {/* Advance requests table */}
                    <details className="disclosure-panel evidence-panel mt-18" open>
                        <summary>
                            <h2 className="card-title">Advance requests</h2>
                            <Icon name="chevron-down" />
                        </summary>
                        <div className="disclosure-content">
                        <Table
                            headers={['Model', 'Amount', 'Status', '']}
                            emptyTitle="No advance requests yet"
                            emptyDescription="Request an advance from the Advance option panel."
                            rows={invoiceAdvances.map(adv => [
                                adv.financingModel === 'InvoiceFactoring' ? 'Factoring' : 'Discounting',
                                formatCurrency(adv.advanceAmount, invoice.currency),
                                <StatusBadge key="s" status={adv.status} />,
                                <button
                                    key="v"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/advances/${adv.id}`)}
                                >
                                    <Icon name="open" /> View
                                </button>,
                            ])}
                        />
                        </div>
                    </details>
                </div>

                {/* ── Right: stacked cards ── */}
                <div>
                    {/* Advance option */}
                    <div className="card card-gold">
                        <h2 className="card-title">Advance option</h2>
                        <ModelBadge model={quote.financingModel} />
                        <p className="soft-text mt-12">
                            {quote.financingModel === 'InvoiceFactoring'
                                ? 'Client confirms the invoice and pays Hassil on the due date.'
                                : 'Client is not notified. Repayment happens after client payment is received.'}
                        </p>
                        <div className="verification-list mt-16">
                            {[
                                { label: 'Supporting document attached', ok: (invoice.documents?.length ?? 0) > 0 },
                                { label: `Invoice amount within ${formatCurrency(quote.maxEligibleInvoiceAmount, invoice.currency)} limit`, ok: invoice.amount <= quote.maxEligibleInvoiceAmount },
                                { label: 'Due date is inside the eligible window', ok: new Date(invoice.dueDate).getTime() > Date.now() },
                                {
                                    label: quote.financingModel === 'InvoiceFactoring'
                                        ? 'Client confirmation required for factoring'
                                        : 'Client notification skipped for discounting',
                                    ok: true,
                                },
                            ].map((check) => (
                                <div key={check.label} className={`verification-item ${check.ok ? 'ok' : 'bad'}`}>
                                    <span>{check.ok ? 'OK' : 'Check'}</span>
                                    <p>{check.label}</p>
                                </div>
                            ))}
                        </div>
                        {!invoice.advanceRequestId && (
                            <div className="mt-16">
                                <button
                                    className="btn btn-primary full-width"
                                    onClick={() => navigate(`/invoices/${invoice.id}/advance`)}
                                >
                                    <Icon name="advance" /> Request Advance
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Transaction timeline */}
                    <div className="card mt-24">
                        <div className="card-header">
                            <h2 className="card-title">Timeline</h2>
                        </div>
                        <TransactionTimeline transactions={invoiceTransactions} />
                    </div>
                </div>

            </div>
        </>
    )
}
