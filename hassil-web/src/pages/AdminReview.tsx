import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { AdminDecision, AdvanceRequest, AiReviewSnapshot, Invoice, User } from '../types'
import {
    mockUsers,
    formatCurrency,
    getModelLabel,
    getReviewFlags,
} from '../data/mockApi'
import { AdminService } from '../services/adminService'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import ModelBadge from '../components/ModelBadge'
import DetailGrid from '../components/DetailGrid'
import DisclosurePanel from '../components/DisclosurePanel'
import ReviewScore from '../components/ReviewScore'
import Breadcrumbs from '../components/Breadcrumbs'
import Table from '../components/Table'
import Icon from '../components/Icon'

const currentUser: User = mockUsers[2] // admin user

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
    const [advances, setAdvances] = useState<AdvanceRequest[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [aiSnapshots, setAiSnapshots] = useState<AiReviewSnapshot[]>([])
    const [filter, setFilter] = useState('Needs action')

    const load = async () => {
        const [advancesData, invoicesData, aiSnapshotsData] = await AdminService.getReviewData()
        setAdvances(advancesData)
        setInvoices(invoicesData)
        setAiSnapshots(aiSnapshotsData)
    }

    useEffect(() => { load() }, [])

    const doDecision = async (id: string, decision: AdminDecision) => {
        const adv = advances.find((a) => a.id === id)
        if (!adv) return
        const now = new Date().toISOString()
        const newStatus = decision === 'Approved' ? 'Approved' : decision === 'Rejected' ? 'Rejected' : 'PendingReview'
        
        await AdminService.updateAdvance(id, { status: newStatus, updatedAt: now })
        await AdminService.updateInvoice(adv.invoiceId, { status: newStatus === 'Approved' ? 'Approved' : newStatus === 'Rejected' ? 'Rejected' : 'PendingReview' })
        await AdminService.addReview({
            advanceRequestId: id,
            reviewerUserId: currentUser.id,
            decision,
            notes: decision === 'RequestMoreInfo' ? 'Additional evidence requested.' : 'Manual review completed.',
        })
        await load()
        navigate('/admin')
    }

    // Detail view
    if (advanceId) {
        const selected = advances.find((a) => a.id === advanceId)
        const invoice = selected ? invoices.find((inv) => inv.id === selected.invoiceId) : null
        const ai = selected ? aiSnapshots.find((s) => s.advanceRequestId === selected.id) : null
        const user = selected ? mockUsers.find((u) => u.id === selected.userId) : null

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
                        </DisclosurePanel>
                        <ReviewScore score={selected.reviewScore} flags={flags} />
                        <div className="form-actions mt-16">
                            <button className="btn btn-danger" onClick={() => doDecision(selected.id, 'Rejected')}>
                                <Icon name="review" /> Reject
                            </button>
                            <button className="btn btn-secondary" onClick={() => doDecision(selected.id, 'RequestMoreInfo')}>
                                <Icon name="invoice" /> Request More Info
                            </button>
                            <button className="btn btn-success" onClick={() => doDecision(selected.id, 'Approved')}>
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

    // List view
    const filterOptions = ['Needs action', 'Pending review', 'Awaiting client', 'Rejected', 'Low score', 'Factoring', 'Discounting']
    const queue = advances.filter((adv) => {
        if (filter === 'Needs action') return ['PendingReview', 'PendingClientConfirmation'].includes(adv.status) || adv.reviewScore < 75
        if (filter === 'Pending review') return adv.status === 'PendingReview'
        if (filter === 'Awaiting client') return adv.status === 'PendingClientConfirmation'
        if (filter === 'Rejected') return adv.status === 'Rejected'
        if (filter === 'Low score') return adv.reviewScore < 75
        if (filter === 'Factoring') return adv.financingModel === 'InvoiceFactoring'
        if (filter === 'Discounting') return adv.financingModel === 'InvoiceDiscounting'
        return true
    })

    return (
        <>
            <PageHeading title="Admin review" description="Review pending and flagged requests." />
            <div className="card">
                <div className="segmented-control mb-18" role="tablist">
                    {filterOptions.map((opt) => (
                        <button key={opt} className={filter === opt ? 'active' : ''} onClick={() => setFilter(opt)} type="button">
                            {opt}
                        </button>
                    ))}
                </div>
                <Table
                    headers={['User', 'Model', 'Invoice', 'Amount', 'Score', 'Status', 'Action']}
                    emptyTitle="No reviews waiting"
                    emptyDescription="Flagged or pending requests will appear here."
                    rows={queue.map((adv) => {
                        const inv = invoices.find((i) => i.id === adv.invoiceId)
                        const usr = mockUsers.find((u) => u.id === adv.userId)
                        if (!inv || !usr) return []
                        return [
                            usr.smallBusinessProfile?.businessName ?? usr.freelancerProfile?.fullName ?? usr.email,
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
