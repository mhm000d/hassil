import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ConfirmationStatus } from '../types'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'
import { PublicService, type ClientConfirmationDetails } from '../services/publicService'
import DetailGrid from '../components/DetailGrid'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import { useAuth } from '../hooks'

function ConfirmShell({ children }: { children: ReactNode }) {
    return (
        <main className="confirm-page">
            <div className="confirm-card">
                {children}
            </div>
        </main>
    )
}

export default function ClientConfirmation() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [details, setDetails] = useState<ClientConfirmationDetails | null>(null)
    const [note, setNote] = useState('Work received and invoice details are correct.')
    const [done, setDone] = useState(false)
    const [loading, setLoading] = useState(true)
    const [responding, setResponding] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        const load = async () => {
            if (!token) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)
                const response = await PublicService.getClientConfirmation(token)
                if (active) setDetails(response)
            } catch (err: any) {
                if (active) setError(err.message || 'Client confirmation link was not found')
            } finally {
                if (active) setLoading(false)
            }
        }

        load()

        return () => {
            active = false
        }
    }, [token])

    const respond = async (status: ConfirmationStatus) => {
        if (!token || responding) return

        try {
            setResponding(true)
            setError(null)
            const response = status === 'Confirmed'
                ? await PublicService.confirmClientConfirmation(token, note)
                : await PublicService.disputeClientConfirmation(token, note)
            setDetails(response)
            setDone(true)
        } catch (err: any) {
            setError(err.message || 'Failed to submit response')
        } finally {
            setResponding(false)
        }
    }

    const getReturnPath = (currentDetails = details) => {
        if (user?.role === 'Admin' && currentDetails?.advanceRequest?.id) return `/admin/${currentDetails.advanceRequest.id}`
        if (user && currentDetails?.advanceRequest?.id) return `/advances/${currentDetails.advanceRequest.id}`
        if (user) return '/dashboard'
        return null
    }

    const returnToApp = () => {
        const returnPath = getReturnPath()
        navigate(returnPath ?? '/')
    }

    if (loading) {
        return (
            <ConfirmShell>
                <Logo onClick={returnToApp} />
                <div className="confirm-loading">
                    <div className="quote-loading-icon"><Icon name="link" /></div>
                    <h1 className="card-title mt-16">Loading invoice confirmation</h1>
                    <p className="soft-text mt-8">Checking the secure confirmation link.</p>
                </div>
            </ConfirmShell>
        )
    }

    if (!token || !details) {
        return (
            <ConfirmShell>
                <Logo onClick={returnToApp} />
                <div className="confirm-loading">
                    <h1 className="card-title mt-16">Client link not found</h1>
                    <p className="soft-text mt-8">{error ?? 'Ask the supplier to send a fresh confirmation link.'}</p>
                    <button className="btn btn-primary mt-16" onClick={returnToApp}>
                        <Icon name="open" /> {user ? 'Back to workspace' : 'Visit Hassil'}
                    </button>
                </div>
            </ConfirmShell>
        )
    }

    const { invoice, confirmation, advanceRequest } = details
    const isExpired = confirmation.status === 'Pending' && new Date(confirmation.expiresAt).getTime() < Date.now()
    const isFactoring = advanceRequest?.financingModel === 'InvoiceFactoring'
    const returnPath = getReturnPath(details)

    if (isExpired) {
        return (
            <ConfirmShell>
                <Logo onClick={returnToApp} />
                <div className="confirm-loading">
                    <h1 className="card-title mt-16">Confirmation link expired</h1>
                    <p className="soft-text mt-8">Ask the supplier to issue a new confirmation request.</p>
                    <button className="btn btn-primary mt-16" onClick={returnToApp}>
                        <Icon name="open" /> {returnPath ? 'Return to advance request' : 'Visit Hassil'}
                    </button>
                </div>
            </ConfirmShell>
        )
    }

    if (done || confirmation.status !== 'Pending') {
        const status = confirmation.status

        return (
            <ConfirmShell>
                <Logo onClick={returnToApp} />
                <div className={`confirm-result ${status === 'Confirmed' ? 'success' : 'warning'}`}>
                    <div className="invoice-success-icon">
                        <Icon name={status === 'Confirmed' ? 'check' : 'review'} />
                    </div>
                    <div>
                        <h1>{status === 'Confirmed' ? 'Invoice confirmed' : 'Invoice disputed'}</h1>
                        <p>{status === 'Confirmed' ? 'Your confirmation has been recorded and the supplier can continue their Hassil request.' : 'Your dispute has been recorded and the supplier will need to resolve it before funding continues.'}</p>
                    </div>
                </div>
                <div className="confirm-section">
                    <DetailGrid
                        items={[
                            ['Invoice', invoice.invoiceNumber],
                            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                            ['Status', status],
                            ['Client note', confirmation.clientNote ?? note],
                            ['Responded at', confirmation.respondedAt ? formatDateTime(confirmation.respondedAt) : 'Just now'],
                        ]}
                    />
                </div>
                {returnPath ? (
                    <button className="btn btn-primary full-width mt-18" onClick={() => navigate(returnPath)}>
                        <Icon name="back" /> Return to advance request
                    </button>
                ) : (
                    <div className="confirm-section">
                        <h2 className="card-title">Response complete</h2>
                        <p className="soft-text mt-8">You can close this page. The supplier will see your response in their Hassil workspace.</p>
                    </div>
                )}
            </ConfirmShell>
        )
    }

    return (
        <ConfirmShell>
            <Logo onClick={returnToApp} />
            <div className="confirm-hero">
                <span>Secure client confirmation</span>
                <h1>Confirm invoice {invoice.invoiceNumber}</h1>
                <p>
                    {invoice.client.name}, please confirm whether the work was delivered and the invoice details match your records.
                </p>
            </div>

            <div className="confirm-summary">
                <div>
                    <span>Invoice amount</span>
                    <strong>{formatCurrency(invoice.amount, invoice.currency)}</strong>
                </div>
                <div>
                    <span>Due date</span>
                    <strong>{formatDate(invoice.dueDate)}</strong>
                </div>
                <div>
                    <span>Supplier request</span>
                    <strong>{advanceRequest ? formatCurrency(advanceRequest.advanceAmount, invoice.currency) : 'Pending'}</strong>
                </div>
            </div>

            <div className="confirm-section">
                <DetailGrid
                    items={[
                        ['Invoice', invoice.invoiceNumber],
                        ['Client', `${invoice.client.name} · ${invoice.client.email}`],
                        ['Amount', formatCurrency(invoice.amount, invoice.currency)],
                        ['Due date', formatDate(invoice.dueDate)],
                        ['Payment instruction', isFactoring ? 'Pay the invoice amount through Hassil when it becomes due.' : 'This confirmation does not change your payment relationship.'],
                        ['Request status', advanceRequest?.status ?? 'Pending client confirmation'],
                    ]}
                />
            </div>

            <div className="confirm-meaning">
                <h2 className="card-title">What you are confirming</h2>
                <div className="verification-list mt-16">
                    {[
                        'The work or service has been delivered.',
                        'The invoice amount and due date are correct.',
                        isFactoring
                            ? 'You understand the invoice will be settled through Hassil.'
                            : 'You understand this is only a delivery confirmation.',
                    ].map((item) => (
                        <div key={item} className="verification-item ok">
                            <span>OK</span>
                            <p>{item}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-group mt-18">
                <label>Client note</label>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            {error && <p className="error-text mt-16">{error}</p>}
            <div className="confirm-actions">
                <button className="btn btn-danger" onClick={() => respond('Disputed')} disabled={responding}>
                    Dispute invoice
                </button>
                <button className="btn btn-primary" onClick={() => respond('Confirmed')} disabled={responding}>
                    {responding ? 'Submitting...' : 'Confirm invoice'}
                </button>
            </div>
        </ConfirmShell>
    )
}
