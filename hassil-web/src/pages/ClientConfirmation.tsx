import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { ConfirmationStatus, Invoice } from '../types'
import { formatCurrency, formatDate, formatDateTime } from '../data/mockApi'
import { PublicService } from '../services/publicService'
import { useAdvances, useInvoices } from '../hooks'
import DetailGrid from '../components/DetailGrid'
import Logo from '../components/Logo'

export default function ClientConfirmation() {
    const { token } = useParams<{ token: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { update: updateInvoice } = useInvoices()
    const { update: updateAdvance } = useAdvances()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [note, setNote] = useState('Work received and invoice details are correct.')
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // When previewed from AdvanceDetail, a ?from=advanceId param is passed
    const fromAdvanceId = searchParams.get('from')

    useEffect(() => {
        if (token) {
            setLoading(true)
            PublicService.getClientConfirmation(token)
                .then((res) => { if (res) setInvoice(res.invoice) })
                .finally(() => setLoading(false))
        }
    }, [token])

    const respond = async (status: ConfirmationStatus) => {
        if (!token || !invoice || submitting) return
        setSubmitting(true)
        const now = new Date().toISOString()
        await PublicService.updateClientConfirmation(token, {
            status,
            clientNote: note,
            respondedAt: now,
        })
        if (status === 'Confirmed') {
            await updateInvoice(invoice.id, { status: 'Confirmed' })
            // Move advance to PendingReview so admin sees it in the queue
            if (invoice.advanceRequestId) {
                await updateAdvance(invoice.advanceRequestId, { status: 'PendingReview', updatedAt: now })
            }
        } else {
            // Client disputed — cancel the advance
            await updateInvoice(invoice.id, { status: 'Disputed' })
            if (invoice.advanceRequestId) {
                await updateAdvance(invoice.advanceRequestId, {
                    status: 'Rejected',
                    rejectionReason: 'Client disputed the invoice.',
                    updatedAt: now,
                })
            }
        }
        setDone(true)
        // Reload the page then navigate back to advance detail so fresh state is picked up
        setTimeout(() => {
            window.location.href = fromAdvanceId ? `/advances/${fromAdvanceId}` : '/dashboard'
        }, 1500)
    }

    const goBack = () => {
        if (fromAdvanceId) navigate(`/advances/${fromAdvanceId}`)
        else navigate('/dashboard')
    }

    const backLabel = '← Back'

    // Wrapper: back button sits above the card, outside it
    const wrap = (content: React.ReactNode) => (
        <main className="confirm-page">
            <div style={{ display: 'flex', flexDirection: 'column', width: 'min(620px, 100%)', gap: 12 }}>
                {fromAdvanceId && (
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ alignSelf: 'flex-start' }}
                        dir="ltr"
                        onClick={goBack}
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
                <button className="btn btn-primary mt-16" dir="ltr" onClick={goBack}>
                    {backLabel}
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
                <button className="btn btn-primary mt-16" dir="ltr" onClick={goBack}>
                    {backLabel}
                </button>
            </>
        )
    }

    if (done || (confirmation && confirmation.status !== 'Pending')) {
        const status = confirmation?.status ?? 'Confirmed'
        const isConfirmed = status === 'Confirmed'
        return wrap(
            <>
                <div className="page-heading compact-heading" style={{ marginTop: 12 }}>
                    <h1>{isConfirmed ? '✓ Invoice confirmed' : '✗ Invoice disputed'}</h1>
                    <p>{isConfirmed
                        ? 'Payment instruction recorded. The advance will now be reviewed.'
                        : 'The advance has been cancelled. Redirecting back...'
                    }</p>
                </div>
                {invoice && (
                    <DetailGrid
                        items={[
                            ['Invoice', invoice.invoiceNumber],
                            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                            ['Decision', status],
                            ['Client note', confirmation?.clientNote ?? note],
                            ['Responded at', confirmation?.respondedAt ? formatDateTime(confirmation.respondedAt) : 'Just now'],
                        ]}
                    />
                )}
                <button className="btn btn-primary full-width mt-18" dir="ltr" onClick={() => {
                    window.location.href = fromAdvanceId ? `/advances/${fromAdvanceId}` : '/dashboard'
                }}>
                    {backLabel}
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
                <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={submitting} />
            </div>
            {submitting ? (
                <div className="simulation-panel mt-18" style={{ textAlign: 'center' }}>
                    <p className="soft-text">Processing... redirecting back shortly.</p>
                </div>
            ) : (
                <div className="form-actions">
                    <button className="btn btn-danger" onClick={() => respond('Disputed')}>Dispute Invoice</button>
                    <button className="btn btn-primary" onClick={() => respond('Confirmed')}>Confirm and Redirect Payment</button>
                </div>
            )}
        </>
    )
}
