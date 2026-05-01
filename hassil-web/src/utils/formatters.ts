import type { FinancingModel } from '../types'

export function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value)
}

export function formatDate(dateStr: string) {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function daysUntilDate(dateStr: string) {
    return Math.ceil((new Date(`${dateStr}T12:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        Draft: 'Draft',
        Submitted: 'Submitted',
        AdvanceRequested: 'Advance requested',
        PendingClientConfirmation: 'Awaiting client',
        Confirmed: 'Confirmed',
        Disputed: 'Disputed',
        PendingReview: 'Pending review',
        Approved: 'Approved',
        Disbursed: 'Funded',
        ClientPaymentDetected: 'Payment detected',
        ClientPaidHassil: 'Client paid',
        BufferReleased: 'Buffer released',
        Paid: 'Paid',
        Rejected: 'Rejected',
        Repaid: 'Repaid',
        Defaulted: 'Defaulted',
        Cancelled: 'Cancelled',
    }

    return map[status] ?? status
}

export function getStatusColor(status: string): string {
    if (['Paid', 'Approved', 'Repaid', 'BufferReleased', 'Confirmed'].includes(status)) return 'status-success'
    if (['PendingClientConfirmation', 'PendingReview', 'ClientPaymentDetected', 'ClientPaidHassil'].includes(status)) return 'status-pending'
    if (['Submitted', 'AdvanceRequested', 'Disbursed'].includes(status)) return 'status-warning'
    if (['Rejected', 'Disputed', 'Defaulted', 'Cancelled'].includes(status)) return 'status-error'
    return 'status-draft'
}

export function getModelLabel(model: FinancingModel): string {
    return model === 'InvoiceFactoring' ? 'Invoice Factoring' : 'Invoice Discounting'
}

export function getTrustScoreColor(score: number): string {
    if (score >= 75) return 'var(--teal)'
    if (score >= 50) return 'var(--amber)'
    return 'var(--red)'
}

export function getTrustScoreLabel(score: number): string {
    if (score >= 75) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Low'
}
