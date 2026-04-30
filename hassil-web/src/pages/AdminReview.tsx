import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminDecision, AdvanceRequest, AiReviewSnapshot } from '../types'
import { formatCurrency, formatDate, formatDateTime, getModelLabel } from '../utils/formatters'
import { AdminService, type AdminAdvanceRequestDetail } from '../services/adminService'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import ReviewScore from '../components/ReviewScore'
import Breadcrumbs from '../components/Breadcrumbs'
import Table from '../components/Table'
import Icon from '../components/Icon'
import { useAuth } from '../hooks'
import { restoreRequesterSession } from '../services'

function AiReviewCard({ snapshot }: { snapshot: AiReviewSnapshot }) {
    const statusMap = { Low: 'Approved', Medium: 'PendingReview', High: 'Rejected' } as const
    return (
        <div className="ai-review-card">
            <div className="ai-review-header">
                <span className="ai-badge">AI Review Assistant</span>
                <StatusBadge status={statusMap[snapshot.riskLevel]} />
            </div>
            <h2 className="card-title">Recommended: {snapshot.recommendedAction}</h2>
            <p className="ai-review-summary">{snapshot.summary}</p>
            <div className="risk-flags">
                {snapshot.riskFlags.length === 0 ? (
                    <div className="risk-flag-item success">No extra risk flags</div>
                ) : (
                    snapshot.riskFlags.map((flag) => <div key={flag} className="risk-flag-item">{flag}</div>)
                )}
            </div>
        </div>
    )
}

function checklistFlags(detail: AdminAdvanceRequestDetail) {
    const failedChecks = detail.verificationChecklist
        .filter((item) => !item.passed)
        .map((item) => item.detail ? `${item.label}: ${item.detail}` : item.label)
    const aiFlags = detail.latestAiReview?.riskFlags ?? []
    return [...new Set([...failedChecks, ...aiFlags])]
}

function filterAdvances(advances: AdvanceRequest[], filter: string) {
    return advances.filter((advance) => {
        if (filter === 'Low score') return advance.reviewScore < 75
        if (filter === 'Factoring') return advance.financingModel === 'InvoiceFactoring'
        if (filter === 'Discounting') return advance.financingModel === 'InvoiceDiscounting'
        return true
    })
}

type DecisionResult = {
    decision: AdminDecision
    title: string
    description: string
}

function decisionCopy(decision: AdminDecision): Omit<DecisionResult, 'decision'> {
    if (decision === 'Approved') {
        return {
            title: 'Request approved',
            description: 'The advance can now move into disbursement and repayment tracking.',
        }
    }

    if (decision === 'Rejected') {
        return {
            title: 'Request rejected',
            description: 'The user will see the request as rejected with the reviewer note attached.',
        }
    }

    return {
        title: 'More information requested',
        description: 'The request stays out of normal approval until the requested information is handled.',
    }
}

function aiRecommendationLabel(snapshot?: AiReviewSnapshot) {
    if (!snapshot) return 'Not generated'
    if (snapshot.recommendedAction === 'ManualReview') return 'Manual review'
    return snapshot.recommendedAction
}

export default function AdminReview() {
    const { advanceId } = useParams<{ advanceId?: string }>()
    const navigate = useNavigate()
    const { login, me } = useAuth()
    const [pendingAdvances, setPendingAdvances] = useState<AdvanceRequest[]>([])
    const [detail, setDetail] = useState<AdminAdvanceRequestDetail | null>(null)
    const [filter, setFilter] = useState('Needs action')
    const [reviewNote, setReviewNote] = useState('Manual review completed.')
    const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null)
    const [returningToRequester, setReturningToRequester] = useState(false)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadPending = async () => {
        try {
            setLoading(true)
            setError(null)
            setDetail(null)
            setDecisionResult(null)
            setReturningToRequester(false)
            const data = await AdminService.listPending()
            setPendingAdvances(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load admin review queue')
        } finally {
            setLoading(false)
        }
    }

    const loadDetail = async (id: string) => {
        try {
            setLoading(true)
            setError(null)
            setDecisionResult(null)
            setReturningToRequester(false)
            setReviewNote('Manual review completed.')
            const data = await AdminService.getDetail(id)
            setDetail(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load admin review detail')
            setDetail(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (advanceId) loadDetail(advanceId)
        else loadPending()
    }, [advanceId])

    const doDecision = async (decision: AdminDecision) => {
        if (!detail || actionLoading) return

        try {
            setActionLoading(true)
            setError(null)
            const note = reviewNote.trim()
            let updated: AdminAdvanceRequestDetail

            if (decision === 'Approved') {
                updated = await AdminService.approve(detail.advanceRequest.id, note || 'Manual review completed.')
            } else if (decision === 'Rejected') {
                updated = await AdminService.reject(detail.advanceRequest.id, note || 'Rejected by admin reviewer.')
            } else {
                updated = await AdminService.requestMoreInfo(
                    detail.advanceRequest.id,
                    note || 'Additional evidence requested.',
                )
            }

            const copy = decisionCopy(decision)
            setDetail(updated)
            setDecisionResult({ decision, ...copy })
            setPendingAdvances((current) => current.filter((advance) => advance.id !== detail.advanceRequest.id))
        } catch (err: any) {
            setError(err.message || 'Could not submit admin decision')
        } finally {
            setActionLoading(false)
        }
    }

    const continueAsRequester = async () => {
        if (!detail || returningToRequester) return

        const persona = detail.advanceRequest.financingModel === 'InvoiceDiscounting'
            ? 'freelancer'
            : 'small_business'

        try {
            setReturningToRequester(true)
            setError(null)

            if (restoreRequesterSession()) {
                await me()
            } else {
                await login({ persona })
            }

            navigate(`/advances/${detail.advanceRequest.id}`)
        } catch (err: any) {
            setError(err.message || 'Could not switch back to the requester workspace')
        } finally {
            setReturningToRequester(false)
        }
    }

    const generateAiReview = async () => {
        if (!detail || actionLoading) return

        try {
            setActionLoading(true)
            setError(null)
            const updated = await AdminService.generateAiReview(detail.advanceRequest.id)
            setDetail(updated)
        } catch (err: any) {
            setError(err.message || 'Could not generate AI review')
        } finally {
            setActionLoading(false)
        }
    }

    const queue = useMemo(() => filterAdvances(pendingAdvances, filter), [filter, pendingAdvances])
    const queueStats = useMemo(() => ({
        total: pendingAdvances.length,
        lowScore: pendingAdvances.filter((advance) => advance.reviewScore < 75).length,
        factoring: pendingAdvances.filter((advance) => advance.financingModel === 'InvoiceFactoring').length,
        discounting: pendingAdvances.filter((advance) => advance.financingModel === 'InvoiceDiscounting').length,
    }), [pendingAdvances])

    if (advanceId) {
        if (loading) {
            return (
                <div className="card">
                    <h2 className="card-title">Loading review</h2>
                    <p className="soft-text mt-8">Fetching request signals, checklist, and review history.</p>
                </div>
            )
        }

        if (!detail) {
            return (
                <div className="card">
                    <h2 className="card-title">Advance not found</h2>
                    {error && <p className="error-text mt-8">{error}</p>}
                    <button className="btn btn-primary mt-16" onClick={() => navigate('/admin')}>Back to admin</button>
                </div>
            )
        }

        const selected = detail.advanceRequest
        const invoice = detail.invoice
        const flags = checklistFlags(detail)
        const canDecide = selected.status === 'PendingReview' && !decisionResult
        const clientConfirmation = selected.clientConfirmationStatus
            ?? (selected.clientNotificationRequired ? 'Pending' : 'Not required')
        const decisionTone = decisionResult?.decision === 'Approved'
            ? 'decision-success'
            : decisionResult?.decision === 'Rejected'
                ? 'decision-error'
                : 'decision-warning'
        const requesterWorkspaceLabel = selected.financingModel === 'InvoiceDiscounting'
            ? 'freelancer workspace'
            : 'business workspace'

        return (
            <>
                <Breadcrumbs items={[{ label: 'Admin review', onClick: () => navigate('/admin') }, { label: invoice.invoiceNumber }]} />
                <PageHeading title="Admin review detail" description="Review invoice details, checklist results, score, and recommended action." />
                {error && <p className="error-text mb-18">{error}</p>}
                <div className={`admin-decision-desk ${decisionResult ? decisionTone : ''}`}>
                    <div className="admin-decision-copy">
                        <span className="small-label">Decision desk</span>
                        <h2>{decisionResult ? decisionResult.title : 'Ready for reviewer decision'}</h2>
                        <p>
                            {decisionResult
                                ? decisionResult.description
                                : 'Use the confirmation status, score, checklist, and invoice details before approving or asking for more information.'}
                        </p>
                    </div>
                    <div className="admin-decision-facts">
                        <div>
                            <span>Score</span>
                            <strong>{selected.reviewScore}/100</strong>
                        </div>
                        <div>
                            <span>Risk flags</span>
                            <strong>{flags.length}</strong>
                        </div>
                        <div>
                            <span>AI recommendation</span>
                            <strong>{aiRecommendationLabel(detail.latestAiReview)}</strong>
                        </div>
                        <div>
                            <span>Client confirmation</span>
                            <strong>{clientConfirmation}</strong>
                        </div>
                    </div>
                    {decisionResult ? (
                        <div className="admin-decision-complete">
                            {decisionResult.decision === 'Approved' && (
                                <button className="btn btn-primary" onClick={continueAsRequester} disabled={returningToRequester}>
                                    <Icon name="advance" /> {returningToRequester ? 'Opening request...' : `Continue in ${requesterWorkspaceLabel}`}
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                                <Icon name="back" /> Back to review queue
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="form-group admin-review-note">
                                <label>Reviewer note</label>
                                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
                            </div>
                            <div className="admin-decision-actions">
                                <button className="btn btn-danger" onClick={() => doDecision('Rejected')} disabled={!canDecide || actionLoading}>
                                    <Icon name="review" /> Reject
                                </button>
                                <button className="btn btn-secondary" onClick={() => doDecision('RequestMoreInfo')} disabled={!canDecide || actionLoading}>
                                    <Icon name="invoice" /> Request more info
                                </button>
                                <button className="btn btn-success" onClick={() => doDecision('Approved')} disabled={!canDecide || actionLoading}>
                                    <Icon name="check" /> Approve
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <div className="grid-2 wide-left">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Request signals</h2>
                            <StatusBadge status={selected.status} />
                        </div>
                        <DetailGrid
                            items={[
                                ['Financing model', getModelLabel(selected.financingModel)],
                                ['Client', `${invoice.client.name} · ${invoice.client.email}`],
                                ['Invoice amount', formatCurrency(invoice.amount, invoice.currency)],
                                ['Requested advance', `${Math.round(selected.requestedPercent * 100)}% · ${formatCurrency(selected.advanceAmount, invoice.currency)}`],
                                ['Fee', `${(selected.feeRate * 100).toFixed(1)}% · ${formatCurrency(selected.feeAmount, invoice.currency)}`],
                                ['Due date', formatDate(invoice.dueDate)],
                            ]}
                        />
                        <DisclosurePanel title="More review data">
                            <DetailGrid
                                items={[
                                    ['Repayment party', selected.repaymentParty],
                                    ['Client notification', selected.clientNotificationRequired ? 'Required' : 'Not required'],
                                    ['Client confirmation', selected.clientConfirmationStatus ?? 'Not required'],
                                    ['Supporting documents', `${invoice.documentCount ?? 0}`],
                                    ['Terms version', selected.termsVersion ?? 'N/A'],
                                    ['Terms accepted', selected.termsAcceptedAt ? formatDateTime(selected.termsAcceptedAt) : 'No'],
                                ]}
                            />
                        </DisclosurePanel>
                        <ReviewScore score={selected.reviewScore} flags={flags} />

                        <div className="verification-list mt-16">
                            {detail.verificationChecklist.map((item) => (
                                <div key={item.label} className={`verification-item ${item.passed ? 'ok' : 'bad'}`}>
                                    <span>{item.passed ? 'OK' : 'Check'}</span>
                                    <p>{item.detail ? `${item.label}: ${item.detail}` : item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        {detail.latestAiReview ? (
                            <AiReviewCard snapshot={detail.latestAiReview} />
                        ) : (
                            <div className="card">
                                <h2 className="card-title">AI review</h2>
                                <p className="soft-text mt-8">Generate a review snapshot from the latest invoice, trust, and checklist signals.</p>
                                <button className="btn btn-secondary full-width mt-16" onClick={generateAiReview} disabled={actionLoading}>
                                    <Icon name="review" /> Generate AI review
                                </button>
                            </div>
                        )}

                        <div className="card mt-24">
                            <div className="card-header">
                                <h2 className="card-title">Review history</h2>
                                {detail.latestAiReview && (
                                    <button className="btn btn-secondary btn-sm" onClick={generateAiReview} disabled={actionLoading}>
                                        Refresh AI
                                    </button>
                                )}
                            </div>
                            <div className="timeline mt-16">
                                {detail.adminReviews.length === 0 && <p className="soft-text">No admin decisions recorded yet.</p>}
                                {detail.adminReviews.map((review) => (
                                    <div className="timeline-item" key={review.id}>
                                        <span className="timeline-dot" style={{ background: 'var(--amber)' }} />
                                        <div className="timeline-content">
                                            <div className="timeline-type">{review.decision}</div>
                                            <div className="timeline-desc">{review.notes ?? 'No note'}</div>
                                            <div className="timeline-date">{formatDateTime(review.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    const filterOptions = ['Needs action', 'Low score', 'Factoring', 'Discounting']

    return (
        <>
            <PageHeading title="Admin review" description="Review advance requests waiting for manual decision." />
            <div className="invoice-command-grid admin-command-grid">
                <button
                    type="button"
                    className={`invoice-command-card admin-command-card ${filter === 'Needs action' ? 'active' : ''}`}
                    onClick={() => setFilter('Needs action')}
                >
                    <span>Manual queue</span>
                    <strong>{queueStats.total}</strong>
                    <p>Requests waiting for a reviewer decision.</p>
                </button>
                <button
                    type="button"
                    className={`invoice-command-card admin-command-card ${filter === 'Low score' ? 'active' : ''}`}
                    onClick={() => setFilter('Low score')}
                >
                    <span>Needs caution</span>
                    <strong>{queueStats.lowScore}</strong>
                    <p>Scores below 75 should be checked more carefully.</p>
                </button>
                <button
                    type="button"
                    className={`invoice-command-card admin-command-card ${filter === 'Factoring' ? 'active' : ''}`}
                    onClick={() => setFilter('Factoring')}
                >
                    <span>SMB factoring</span>
                    <strong>{queueStats.factoring}</strong>
                    <p>Client-confirmed invoices paid through Hassil.</p>
                </button>
                <button
                    type="button"
                    className={`invoice-command-card admin-command-card ${filter === 'Discounting' ? 'active' : ''}`}
                    onClick={() => setFilter('Discounting')}
                >
                    <span>Freelancer discounting</span>
                    <strong>{queueStats.discounting}</strong>
                    <p>Private client relationship with user repayment.</p>
                </button>
            </div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Review queue</h2>
                    <button className="btn btn-secondary btn-sm" onClick={loadPending} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                {error && <p className="error-text mb-18">{error}</p>}
                <div className="segmented-control mb-18" role="tablist">
                    {filterOptions.map((option) => (
                        <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)} type="button">
                            {option}
                        </button>
                    ))}
                </div>
                <Table
                    headers={['Invoice', 'Model', 'Advance', 'Fee', 'Score', 'Status', 'Action']}
                    emptyTitle={loading ? 'Loading reviews' : 'No reviews waiting'}
                    emptyDescription={loading ? 'Fetching pending review requests.' : 'Pending manual review requests will appear here.'}
                    rows={queue.map((advance) => [
                        <div className="admin-invoice-cell" key="invoice">
                            <strong>{advance.invoiceNumber ?? advance.invoiceId}</strong>
                            <span>
                                {advance.clientNotificationRequired
                                    ? `Client ${advance.clientConfirmationStatus ?? 'Pending'}`
                                    : 'Client not contacted'}
                            </span>
                        </div>,
                        <ModelBadge key="model" model={advance.financingModel} />,
                        formatCurrency(advance.advanceAmount),
                        formatCurrency(advance.feeAmount),
                        <span key="score" className={`score-pill ${advance.reviewScore < 75 ? 'warn' : 'ok'}`}>
                            {advance.reviewScore}/100
                        </span>,
                        <StatusBadge key="status" status={advance.status} />,
                        <button key="action" className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/${advance.id}`)}>
                            <Icon name="review" /> Review
                        </button>,
                    ])}
                />
            </div>
        </>
    )
}
