function getStatusLabel(status: string) {
    if (status === 'Paid') return 'Paid'
    if (status === 'Submitted') return 'Submitted'
    if (status === 'Pending Review') return 'Pending review'
    if (status === 'Pending Confirmation') return 'Pending confirmation'
    if (status === 'Approved') return 'Approved'
    if (status === 'Rejected') return 'Rejected'
    return status
}

function getStatusColor(status: string) {
    if (status === 'Paid') return 'status-success'
    if (status === 'Approved') return 'status-success'
    if (status.includes('Pending')) return 'status-pending'
    if (status === 'Submitted') return 'status-warning'
    if (status === 'Rejected') return 'status-error'
    return 'status-draft'
}

export default function StatusBadge({ status }: { status: string }) {
    return <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
}
