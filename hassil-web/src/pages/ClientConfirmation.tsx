import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { ConfirmationStatus, Invoice } from '../types'
import { formatCurrency, formatDate, formatDateTime } from '../data/mockApi'
import { PublicService } from '../services/publicService'
import { useInvoices } from '../hooks'
import DetailGrid from '../components/DetailGrid'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

export default function ClientConfirmation() {
    const { token } = useParams<{ token: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { update: updateInvoice } = useInvoices()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [note, setNote] = useState('Work received and invoice details are correct.')
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(true)

    // When previewed from InvoiceDetail, a ?from=invoiceId param is passed
    const fromInvoiceId = searchParams.get('from')

    useEffect(() => {
        if (token) {
            setLoading(true)
            PublicService.getClientConfirmation(token)
                .then((res) => { if (res) setInvoice(res.invoice) })
                .finally(() => setLoading(false))
        }
    }, [token])

    const respond = async (status: ConfirmationStatus) => {
        if (!token) return
        await PublicService.updateClientConfirmation(token, {
            status,
            clientNote: note,
            respondedAt: new Date().toISOString(),
        })
        if (invoice) {
            await updateInvoice(invoice.id, { status: status === 'Confirmed' ? 'Confirmed' : 'Disputed' })
        }
        setDone(true)
    }

    const backToInvoice = () => {
        if (fromInvoiceId) navigate(`/invoices/${fromInvoiceId}`)
        else navigate('/dashboard')
    }

    const backLabel = fromInvoiceId ? '← Back to invoice' : '← Back to dashboard'

    // Wrapper: back button sits above the card, outside it
    const wrap = (content: React.ReactNode) => (
        <main className="confirm-page">
            <div style={{ display: 'flex', flexDirection: 'column', width: 'min(620px, 100%)', gap: 12 }}>
                {fromInvoiceId && (
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={backToInvoice}
                    >
                        {backLabel}
                    </button>
                )}
                <div className="confirm-card">
                    <Logo onClick={() => navigate('/')} />
                    {content}
                </div>
            </div>
        </main>
    )

    if (loading) {
        return wrap(<p className="soft-text mt-16">Loading confirmation...</p>)
    }

    if (!token || (!invoice && !done)) {
        return wrap(
            <>
                <h1 className="card-title mt-16">Client link not found</h1>
                <p className="soft-text mt-8">Create a factoring advance first, then open the confirmation link.</p>
                <button className="btn btn-primary mt-16" onClick={backToInvoice}>
                    <Icon name="advance" /> {backLabel}
                </button>
            </>
        )
    }

    const confirmation = invoice?.clientConfirmation
    const isExpired = confirmation?.status === 'Pending' && new Date(confirmation.expiresAt).getTime() < Date.now()

    if (isExpired) {
        return wrap(
            <>
                <h1 className="card-title mt-16">Confirmation link expired</h1>
                <p className="soft-text mt-8">Ask the supplier to issue a new confirmation request.</p>
                <button className="btn btn-primary mt-16" onClick={backToInvoice}>
                    <Icon name="advance" /> {backLabel}
                </button>
            </>
        )
    }

    if (done || (confirmation && confirmation.status !== 'Pending')) {
        const status = confirmation?.status ?? 'Confirmed'
        return wrap(
            <>
                <div className="page-heading compact-heading" style={{ marginTop: 12 }}>
                    <h1>{status === 'Confirmed' ? 'Invoice confirmed' : 'Invoice disputed'}</h1>
                    <p>{status === 'Confirmed' ? 'Payment instruction has been recorded.' : 'The supplier has been notified to resolve the issue.'}</p>
                </div>
                {invoice && (
                    <DetailGrid
                        items={[
                            ['Invoice', invoice.invoiceNumber],
                            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                            ['Status', status],
                            ['Client note', confirmation?.clientNote ?? note],
                            ['Responded at', confirmation?.respondedAt ? formatDateTime(confirmation.respondedAt) : 'Just now'],
                        ]}
                    />
                )}
                <button className="btn btn-primary full-width mt-18" onClick={backToInvoice}>
                    <Icon name="advance" /> {backLabel}
                </button>
            </>
        )
    }

    return wrap(
        <>
            <div className="page-heading compact-heading" style={{ marginTop: 12 }}>
                <h1>Client invoice confirmation</h1>
                <p>Confirm the invoice details and payment instruction.</p>
            </div>
            {invoice && (
                <DetailGrid
                    items={[
                        ['Invoice', invoice.invoiceNumber],
                        ['Client', `${invoice.client.name} · ${invoice.client.email}`],
                        ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                        ['Due date', formatDate(invoice.dueDate)],
                        ['Payment instruction', 'Pay the invoice amount to Hassil.'],
                    ]}
                />
            )}
            <div className="form-group mt-18">
                <label>Client note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="form-actions">
                <button className="btn btn-danger" onClick={() => respond('Disputed')}>Dispute Invoice</button>
                <button className="btn btn-primary" onClick={() => respond('Confirmed')}>Confirm and Redirect Payment</button>
            </div>
        </>
    )
}
