import type { AdvanceStatus, FinancingModel } from '../types'

export default function LifecycleStepper({ status, model, clientConfirmed }: { status: AdvanceStatus; model: FinancingModel; clientConfirmed?: boolean }) {
    const steps =
        model === 'InvoiceFactoring'
            ? [
                  { label: 'Requested', statuses: ['PendingReview', 'PendingClientConfirmation'] },
                  { label: 'Client confirms', statuses: ['PendingClientConfirmation'] },
                  { label: 'Approved', statuses: ['Approved'] },
                  { label: 'Funded', statuses: ['Disbursed'] },
                  { label: 'Client paid', statuses: ['ClientPaidHassil'] },
                  { label: 'Settled', statuses: ['Repaid', 'BufferReleased'] },
              ]
            : [
                  { label: 'Requested', statuses: ['PendingReview'] },
                  { label: 'Approved', statuses: ['Approved'] },
                  { label: 'Funded', statuses: ['Disbursed'] },
                  { label: 'Payment detected', statuses: ['ClientPaymentDetected'] },
                  { label: 'Repaid', statuses: ['Repaid'] },
              ]

    const isTerminal = status === 'Rejected'

    let activeIndex =
        isTerminal
            ? 0
            : Math.max(0, steps.findIndex((step) => step.statuses.includes(status)))

    // For Invoice Factoring: if client confirmed but advance is back to PendingReview
    // (awaiting admin approval), "Client confirms" should show as done (✓) but
    // "Approved" should NOT be active yet.
    const clientConfirmStepDone =
        model === 'InvoiceFactoring' && clientConfirmed && status === 'PendingReview'

    if (clientConfirmStepDone) {
        activeIndex = 1
    }

    return (
        <div className={`lifecycle ${isTerminal ? 'lifecycle-rejected' : ''}`}>
            {steps.map((step, index) => {
                const isDone = clientConfirmStepDone
                    ? index < activeIndex || index === 1
                    : index < activeIndex
                const isActive = !isDone && index === activeIndex
                return (
                    <div
                        key={step.label}
                        className={`lifecycle-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                    >
                        <span>{isDone ? '✓' : index + 1}</span>
                        <strong>{step.label}</strong>
                    </div>
                )
            })}
        </div>
    )
}
