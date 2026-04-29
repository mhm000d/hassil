import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ConfirmationStatus, Invoice } from '../types'
import { mockApi, formatCurrency, formatDate, formatDateTime } from '../data/mockApi'
import DetailGrid from '../components/DetailGrid'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

export default function ClientConfirmation() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [note, setNote] = useState('Work received and invoice details are correct.')
    const [done, setDone] = useState(false)

    useEffect(() => {
        if (token) {
            mockApi.getClientConfirmation(token).then((res) => {
                if (res.data) setInvoice(res.data.invoice)
            })
        }
    }, [token])

    const respond = async (status: ConfirmationStatus) => {
        if (!token) return
        await mockApi.updateClientConfirmation(token, {
            status,
            clientNote: note,
            respondedAt: new Date().toISOString(),
        })
        await mockApi.updateInvoice(invoice!.id, { status: status === 'Confirmed' ? 'Confirmed' : 'Disputed' })
        setDone(true)
    }

    if (!token || (!invoice && !done)) {
        return (
            <main className="confirm-page">
                <div className="confirm-card">
                    <Logo onClick={() => navigate('/')} />
                    <h1 className="card-title mt-16">Client link not found</h1>
                    <p className="soft-text mt-8">Create a factoring advance first, then open the confirmation link.</p>
                    <button className="btn btn-primary mt-16" onClick={() => navigate('/dashboard')}>
                        <Icon name="advance" /> Back to dashboard
                    </button>
                </div>
            </main>
        )
    }

    const confirmation = invoice?.clientConfirmation
    const isExpired = confirmation?.status === 'Pending' && new Date(confirmation.expiresAt).getTime() < Date.now()

    if (isExpired) {
        return (
            <main className="confirm-page">
                <div className="confirm-card">
                    <Logo onClick={() => navigate('/')} />
                    <h1 className="card-title mt-16">Confirmation link expired</h1>
                    <p className="soft-text mt-8">Ask the supplier to issue a new confirmation request.</p>
                    <button className="btn btn-primary mt-16" onClick={() => navigate('/dashboard')}>
                        <Icon name="advance" /> Back to dashboard
                    </button>
                </div>
            </main>
        )
    }

    if (done || (confirmation && confirmation.status !== 'Pending')) {
        const status = confirmation?.status ?? 'Confirmed'
        return (
            <main className="confirm-page">
                <div className="confirm-card">
                    <Logo onClick={() => navigate('/')} />
                    <div className="page-heading compact-heading">
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
                    <button className="btn btn-primary full-width mt-18" onClick={() => navigate('/dashboard')}>
                        <Icon name="advance" /> Back to dashboard
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="confirm-page">
            <div className="confirm-card">
                <Logo onClick={() => navigate('/')} />
                <div className="page-heading compact-heading">
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
            </div>
        </main>
    )
}
