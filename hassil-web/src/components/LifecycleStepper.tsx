import type { AdvanceStatus, FinancingModel } from '../types'

export default function LifecycleStepper({ status, model }: { status: AdvanceStatus; model: FinancingModel }) {
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

    const activeIndex =
        status === 'Rejected'
            ? 0
            : Math.max(
                  0,
                  steps.findIndex((step) => step.statuses.includes(status)),
              )

    return (
        <div className={`lifecycle ${status === 'Rejected' ? 'lifecycle-rejected' : ''}`}>
            {steps.map((step, index) => (
                <div
                    key={step.label}
                    className={`lifecycle-step ${index < activeIndex ? 'done' : ''} ${index === activeIndex ? 'active' : ''}`}
                >
                    <span>{index < activeIndex ? 'OK' : index + 1}</span>
                    <strong>{step.label}</strong>
                </div>
            ))}
        </div>
    )
}
