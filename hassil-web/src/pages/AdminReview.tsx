import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminDecision, AiReviewSnapshot, User } from '../types'
import {
    formatCurrency,
    getModelLabel,
    getReviewFlags,
} from '../data/mockApi'
import { useAuth, useAdmin } from '../hooks'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import ReviewScore from '../components/ReviewScore'
import Breadcrumbs from '../components/Breadcrumbs'
import Table from '../components/Table'
import Icon from '../components/Icon'

function userLabel(user: User): string {
    return (
        user.displayName ??
        user.smallBusinessProfile?.businessName ??
        user.freelancerProfile?.fullName ??
        user.name ??
        user.email
    )
}

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

export default function AdminReview() {
    const { advanceId } = useParams<{ advanceId?: string }>()
    const navigate = useNavigate()
    const { user: authUser } = useAuth()
    const {
        advances,
        invoices,
        aiSnapshots,
        users,
        loading,
        refetch,
        decide,
    } = useAdmin()

    const [filter, setFilter] = useState('Needs action')
    const [deciding, setDeciding] = useState(false)

    // Always pull fresh data on mount — picks up any advances submitted since
    // the admin context was last populated (fixes the user/admin disconnection).
    useEffect(() => {
        refetch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Resolve a userId to a User object using the context users list (which
    // includes both seed users and localStorage-registered users).
    const resolveUser = (userId: string): User | undefined =>
        users.find((u) => u.id === userId)

    const doDecision = async (id: string, decision: AdminDecision) => {
        if (!authUser || deciding) return
        setDeciding(true)
        try {
            await decide(id, decision, authUser.id)
            navigate('/admin')
        } finally {
            setDeciding(false)
        }
    }

    if (loading) {
        return <div className="loading-state">Loading review data...</div>
    }

    // ── Detail view ──────────────────────────────────────────────────────────
    if (advanceId) {
        const selected = advances.find((a) => a.id === advanceId)
        const invoice = selected ? invoices.find((inv) => inv.id === selected.invoiceId) : null
        const ai = selected ? aiSnapshots.find((s) => s.advanceRequestId === selected.id) : null
        const user = selected ? resolveUser(selected.userId) : null

        if (!selected || !invoice || !user) {
            return (
                <div className="card">
                    <h2 className="card-title">Advance not found</h2>
                    <button className="btn btn-primary mt-16" onClick={() => navigate('/admin')}>Back to admin</button>
                </div>
            )
        }

        const flags = getReviewFlags(user, invoice, selected.reviewScore)

        return (
            <>
                <Breadcrumbs items={[{ label: 'Admin review', onClick: () => navigate('/admin') }, { label: invoice.invoiceNumber }]} />
                <PageHeading title="Admin review detail" description="Review invoice evidence, score, flags, and recommended action." />
                <div className="grid-2 wide-left">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Request signals</h2>
                            <StatusBadge status={selected.status} />
                        </div>
                        <DetailGrid
                            items={[
                                ['User', userLabel(user)],
                                ['User type', user.accountType === 'SmallBusiness' ? 'Small Business' : 'Freelancer'],
                                ['Financing model', getModelLabel(selected.financingModel)],
                                ['Trust score', `${user.trustScore}/100`],
                                ['Invoice amount', formatCurrency(invoice.amount, invoice.currency)],
                                ['Requested advance', `${Math.round(selected.requestedPercent * 100)}% · ${formatCurrency(selected.advanceAmount, invoice.currency)}`],
                                ['Fee', `${(selected.feeRate * 100).toFixed(1)}% · ${formatCurrency(selected.feeAmount, invoice.currency)}`],
                            ]}
                        />
                        <DisclosurePanel title="More review data">
                            <DetailGrid
                                items={[
                                    ['Repayment party', selected.repaymentParty],
                                    ['Client notification', selected.clientNotificationRequired ? 'Required' : 'Not required'],
                                    ['Client confirmation', invoice.clientConfirmation?.status ?? 'Not required'],
                                    ['Supporting documents', `${invoice.documents?.length ?? 0}`],
                                ]}
                            />
                            {invoice.documents && invoice.documents.length > 0 && (
                                <div className="mt-16">
                                    <h4 className="small-label">Evidence Files</h4>
                                    <div className="file-list mt-8">
                                        {invoice.documents.map(doc => (
                                            <div key={doc.id} className="file-pill">
                                                <Icon name="document" />
                                                <span>{doc.fileName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </DisclosurePanel>
                        <ReviewScore score={selected.reviewScore} flags={flags} />
                        <div className="form-actions mt-16">
                            <button className="btn btn-danger" disabled={deciding} onClick={() => doDecision(selected.id, 'Rejected')}>
                                <Icon name="review" /> Reject
                            </button>
                            <button className="btn btn-secondary" disabled={deciding} onClick={() => doDecision(selected.id, 'RequestMoreInfo')}>
                                <Icon name="invoice" /> Request More Info
                            </button>
                            <button className="btn btn-success" disabled={deciding} onClick={() => doDecision(selected.id, 'Approved')}>
                                <Icon name="check" /> Approve
                            </button>
                        </div>
                    </div>
                    <div>
                        {ai && <AiReviewCard snapshot={ai} />}
                        <div className="card mt-24">
                            <h2 className="card-title">Reviewer note</h2>
                            <p className="soft-text mt-8">Use the AI summary as a guide, then decide from evidence, score, and confirmation status.</p>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    // ── List view ────────────────────────────────────────────────────────────
    type FilterOption = {
        label: string
        status?: string | string[]
    }

    const filterOptions: FilterOption[] = [
        { label: 'All' },
        { label: 'Pending review',  status: 'PendingReview' },
        { label: 'Awaiting client', status: 'PendingClientConfirmation' },
        { label: 'Approved',        status: 'Approved' },
        { label: 'Funded',          status: 'Disbursed' },
        { label: 'Repaid',          status: 'Repaid' },
        { label: 'Rejected',        status: 'Rejected' },
    ]

    const queue = advances.filter((adv) => {
        if (filter === 'All') return true
        const opt = filterOptions.find((o) => o.label === filter)
        if (!opt?.status) return true
        return Array.isArray(opt.status)
            ? opt.status.includes(adv.status)
            : adv.status === opt.status
    })

    return (
        <>
            <PageHeading
                title="Admin review"
                description={`${advances.length} total advance${advances.length !== 1 ? 's' : ''}`}
            />
            <div className="card">
                <div className="segmented-control mb-18" role="tablist">
                    {filterOptions.map(({ label }) => (
                        <button
                            key={label}
                            className={filter === label ? 'active' : ''}
                            onClick={() => setFilter(label)}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <Table
                    headers={['User', 'Model', 'Invoice', 'Amount', 'Score', 'Status', 'Action']}
                    emptyTitle="No advances found"
                    emptyDescription="Advances matching this filter will appear here."
                    rows={queue.map((adv) => {
                        const inv = invoices.find((i) => i.id === adv.invoiceId)
                        const usr = resolveUser(adv.userId)
                        // Skip rows where we can't resolve the invoice — user is shown as fallback
                        if (!inv) return []
                        const label = usr ? userLabel(usr) : adv.userId
                        return [
                            label,
                            <ModelBadge key="model" model={adv.financingModel} />,
                            inv.invoiceNumber,
                            formatCurrency(inv.amount, inv.currency),
                            `${adv.reviewScore}/100`,
                            <StatusBadge key="status" status={adv.status} />,
                            <button key="action" className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/${adv.id}`)}>
                                <Icon name="review" /> Review
                            </button>,
                        ]
                    })}
                />
            </div>
        </>
    )
}
