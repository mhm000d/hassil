import { getStatusColor, getStatusLabel } from '../utils/formatters'

export default function StatusBadge({ status }: { status: string }) {
    return <span className={`badge ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
}
