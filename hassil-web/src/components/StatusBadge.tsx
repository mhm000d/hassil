import { getStatusColor, getStatusLabel } from '../data/mockApi'

export default function StatusBadge({ status }: { status: string }) {
    return <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
}
