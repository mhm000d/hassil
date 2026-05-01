import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AccountType, FinancingModel, Invoice } from '../types'
import { daysUntilDate, formatCurrency, formatDate, getModelLabel } from '../utils/formatters'
import { useAdvances, useAuth, useInvoices } from '../hooks'
import PageHeading from '../components/PageHeading'
import Breadcrumbs from '../components/Breadcrumbs'
import DetailGrid from '../components/DetailGrid'
import ModelBadge from '../components/ModelBadge'
import Icon from '../components/Icon'

const TERMS_VERSION = 'hackathon-v1'

type StepNumber = 1 | 2 | 3

type AdvanceRules = {
    financingModel: FinancingModel
    maxAdvancePercent: number
    maxEligibleAdvanceAmount: number
    feeRate: number
}

type InvoiceForm = ReturnType<typeof buildStarterInvoiceForm>

function dateInputValue(daysFromToday: number) {
    const date = new Date()
    date.setDate(date.getDate() + daysFromToday)
    return date.toISOString().slice(0, 10)
}

function uniqueInvoiceToken() {
    const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
    return `${Date.now().toString(36)}${random}`.toUpperCase()
}

function getAdvanceRules(accountType: AccountType = 'SmallBusiness', trustScore = 60): AdvanceRules {
    if (accountType === 'Freelancer') {
        if (trustScore < 50) {
            return { financingModel: 'InvoiceDiscounting', maxAdvancePercent: 0.70, maxEligibleAdvanceAmount: 1000, feeRate: 0.050 }
        }
        if (trustScore < 80) {
            return { financingModel: 'InvoiceDiscounting', maxAdvancePercent: 0.80, maxEligibleAdvanceAmount: 3000, feeRate: 0.035 }
        }
        return { financingModel: 'InvoiceDiscounting', maxAdvancePercent: 0.90, maxEligibleAdvanceAmount: 5000, feeRate: 0.020 }
    }

    if (trustScore < 50) {
        return { financingModel: 'InvoiceFactoring', maxAdvancePercent: 0.80, maxEligibleAdvanceAmount: 10000, feeRate: 0.035 }
    }
    if (trustScore < 80) {
        return { financingModel: 'InvoiceFactoring', maxAdvancePercent: 0.90, maxEligibleAdvanceAmount: 25000, feeRate: 0.020 }
    }
    return { financingModel: 'InvoiceFactoring', maxAdvancePercent: 0.95, maxEligibleAdvanceAmount: 50000, feeRate: 0.012 }
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100
}

function buildStarterInvoiceForm(rules: AdvanceRules = getAdvanceRules()) {
    const token = uniqueInvoiceToken()
    const amount = 16000
    const requestedAdvanceAmount = roundMoney(amount * rules.maxAdvancePercent)

    return {
        clientName: 'Noura Retail Group',
        clientEmail: `ap.${token.toLowerCase()}@nouraretail.sa`,
        clientCountry: 'Saudi Arabia',
        invoiceNumber: `AHM-${token.slice(-8)}`,
        receivableSource: 'DirectClientInvoice' as Invoice['receivableSource'],
        amount,
        requestedAdvanceAmount,
        currency: 'USD',
        issueDate: dateInputValue(0),
        dueDate: dateInputValue(45),
        description: 'Campaign assets delivered and approved by client.',
        paymentTerms: 'Net 45',
        hasEvidence: false,
    }
}

function buildProposal(form: InvoiceForm, rules: AdvanceRules) {
    const invoiceAmount = Number(form.amount) || 0
    const advanceAmount = Number(form.requestedAdvanceAmount) || 0
    const requestedPercent = invoiceAmount > 0 ? advanceAmount / invoiceAmount : 0
    const feeAmount = roundMoney(advanceAmount * rules.feeRate)
    const isFactoring = rules.financingModel === 'InvoiceFactoring'
    const settlementBufferAmount = isFactoring ? Math.max(0, roundMoney(invoiceAmount - advanceAmount - feeAmount)) : 0

    return {
        requestedPercent,
        advanceAmount,
        feeAmount,
        settlementBufferAmount,
        expectedRepaymentAmount: isFactoring ? invoiceAmount : roundMoney(advanceAmount + feeAmount),
    }
}

function InvoiceFlowSteps({
    currentStep,
    completedSteps,
}: {
    currentStep: StepNumber
    completedSteps: number[]
}) {
    const steps = [
        { number: 1, label: 'Invoice details' },
        { number: 2, label: 'Summary' },
        { number: 3, label: 'Advance proposal' },
    ]

    return (
        <div className="invoice-flow-steps">
            {steps.map((step) => {
                const state = completedSteps.includes(step.number)
                    ? 'done'
                    : currentStep === step.number
                        ? 'active'
                        : 'pending'

                return (
                    <div key={step.label} className={`invoice-flow-step ${state}`}>
                        <span>{step.number}</span>
                        <p>{step.label}</p>
                    </div>
                )
            })}
        </div>
    )
}

export default function NewInvoice() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const rules = getAdvanceRules(user?.accountType, user?.trustScore)
    const { create, addDocument, submit: submitInvoice, refetch: refetchInvoices } = useInvoices()
    const { create: createAdvance } = useAdvances()

    const [step, setStep] = useState<StepNumber>(1)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [submitError, setSubmitError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [accepted, setAccepted] = useState(false)
    const [form, setForm] = useState(() => buildStarterInvoiceForm(rules))

    const calculatedProposal = buildProposal(form, rules)
    const dueDays = daysUntilDate(form.dueDate)
    const maxPercentAdvance = Number(form.amount) * rules.maxAdvancePercent
    const maxAllowedAdvance = Math.min(maxPercentAdvance, rules.maxEligibleAdvanceAmount)
    const requestedAdvanceTooHigh = Number(form.requestedAdvanceAmount) > maxAllowedAdvance
    const requestedAdvanceInvalid = Number(form.requestedAdvanceAmount) <= 0
    const requestedPercentTooHigh = Number(form.requestedAdvanceAmount) > maxPercentAdvance

    const errors = [
        !form.invoiceNumber.trim() ? 'Invoice number is required.' : '',
        !form.clientName.trim() ? 'Client name is required.' : '',
        !form.clientEmail.trim() ? 'Client email is required.' : '',
        Number(form.amount) <= 0 ? 'Invoice amount must be greater than zero.' : '',
        requestedAdvanceInvalid ? 'Requested advance amount must be greater than zero.' : '',
        requestedAdvanceTooHigh
            ? `Requested advance is above your current funding limit of ${formatCurrency(maxAllowedAdvance, form.currency)}. Lower it before continuing.`
            : '',
        new Date(form.dueDate).getTime() <= new Date(form.issueDate).getTime() ? 'Due date must be after the issue date.' : '',
        dueDays < 0 ? 'Due date cannot be in the past.' : '',
        dueDays > 90 ? 'Due date must be within the next 90 days.' : '',
    ].filter(Boolean) as string[]

    const warnings = [
        dueDays > 75 && dueDays <= 90 ? 'Long payment terms may require extra review.' : '',
        requestedPercentTooHigh && !requestedAdvanceTooHigh
            ? `Requested advance cannot exceed ${(rules.maxAdvancePercent * 100).toFixed(0)}% of the invoice amount.`
            : '',
    ].filter(Boolean) as string[]

    const readyForSummary = errors.length === 0

    const updateForm = (patch: Partial<InvoiceForm>) => {
        setForm((current) => ({ ...current, ...patch }))
        setSubmitError('')
        setAccepted(false)
    }

    const updateInvoiceAmount = (amount: number) => {
        updateForm({
            amount,
            requestedAdvanceAmount: roundMoney(Math.max(0, amount) * rules.maxAdvancePercent),
        })
    }

    const completeStep = (number: StepNumber) => {
        setCompletedSteps((current) => current.includes(number) ? current : [...current, number])
    }

    const goToDetails = () => {
        setStep(1)
        setCompletedSteps([])
        setAccepted(false)
        setSubmitError('')
    }

    const continueToSummary = (event?: FormEvent) => {
        event?.preventDefault()
        if (!readyForSummary) {
            setSubmitError('Adjust the highlighted fields before continuing.')
            return
        }

        completeStep(1)
        setStep(2)
        setSubmitError('')
    }

    const continueToProposal = () => {
        completeStep(2)
        setStep(3)
        setSubmitError('')
    }

    const submitAdvance = async () => {
        if (!readyForSummary || submitting || !accepted) return

        setSubmitting(true)
        setSubmitError('')

        try {
            const created = await create({
                clientName: form.clientName,
                clientEmail: form.clientEmail,
                clientCountry: form.clientCountry,
                invoiceNumber: form.invoiceNumber,
                receivableSource: form.receivableSource,
                amount: Number(form.amount),
                currency: form.currency,
                issueDate: form.issueDate,
                dueDate: form.dueDate,
                description: form.description,
                paymentTerms: form.paymentTerms,
            })

            if (form.hasEvidence) {
                await addDocument(created.id, {
                    fileName: `${form.invoiceNumber}-evidence.pdf`,
                    documentType: 'Supporting Evidence',
                })
            }

            const submitted = await submitInvoice(created.id)
            const advance = await createAdvance({
                invoiceId: submitted.id,
                requestedPercent: calculatedProposal.requestedPercent,
                termsAccepted: accepted,
                termsVersion: TERMS_VERSION,
            })

            await refetchInvoices()
            completeStep(3)
            navigate(`/advances/${advance.id}`)
        } catch (err: any) {
            setSubmitError(err.message || 'Could not submit the advance request.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <PageHeading
                title="Create invoice"
                description="Fill the invoice, review the summary, then submit the advance proposal."
            />
            <InvoiceFlowSteps currentStep={step} completedSteps={completedSteps} />

            {step === 1 && (
                <form className="card form-card" onSubmit={continueToSummary}>
                    <Breadcrumbs items={[{ label: 'Invoices', onClick: () => navigate('/invoices') }, { label: 'Invoice details' }]} />
                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>Invoice number</label>
                            <input value={form.invoiceNumber} onChange={(e) => updateForm({ invoiceNumber: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Receivable source</label>
                            <select value={form.receivableSource} onChange={(e) => updateForm({ receivableSource: e.target.value as Invoice['receivableSource'] })}>
                                <option value="DirectClientInvoice">Direct client invoice</option>
                                <option value="FreelancePlatformPayout">Freelance platform payout</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Client name</label>
                            <input value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Client email</label>
                            <input type="email" value={form.clientEmail} onChange={(e) => updateForm({ clientEmail: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Client country</label>
                            <input value={form.clientCountry} onChange={(e) => updateForm({ clientCountry: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select value={form.currency} onChange={(e) => updateForm({ currency: e.target.value })}>
                                <option>USD</option>
                                <option>AED</option>
                                <option>SAR</option>
                                <option>EGP</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Invoice amount</label>
                            <input type="number" min="1" value={form.amount} onChange={(e) => updateInvoiceAmount(Number(e.target.value))} required />
                        </div>
                        <div className="form-group">
                            <label>Requested advance amount</label>
                            <input
                                className={requestedAdvanceTooHigh || requestedAdvanceInvalid ? 'input-invalid' : undefined}
                                type="number"
                                min="1"
                                max={maxAllowedAdvance}
                                value={form.requestedAdvanceAmount}
                                onChange={(e) => updateForm({ requestedAdvanceAmount: Number(e.target.value) })}
                                required
                            />
                            <p className="form-hint">
                                Current maximum: {formatCurrency(maxAllowedAdvance, form.currency)}.
                            </p>
                            {requestedAdvanceTooHigh && (
                                <p className="form-error">
                                    Lower the requested advance to {formatCurrency(maxAllowedAdvance, form.currency)} or less.
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Issue date</label>
                            <input type="date" value={form.issueDate} onChange={(e) => updateForm({ issueDate: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Due date</label>
                            <input type="date" value={form.dueDate} onChange={(e) => updateForm({ dueDate: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Payment terms</label>
                            <input value={form.paymentTerms} onChange={(e) => updateForm({ paymentTerms: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                    </div>
                    {/*<label className="checkbox-row mb-18">*/}
                    {/*    <input type="checkbox" checked={form.hasEvidence} onChange={(e) => updateForm({ hasEvidence: e.target.checked })} />*/}
                    {/*    <span>Attach evidence file (optional).</span>*/}
                    {/*</label>*/}
                    {(errors.length > 0 || warnings.length > 0 || submitError) && (
                        <div className="feedback-list mb-18">
                            {submitError && <div className="feedback-item error">{submitError}</div>}
                            {errors.map((err) => (
                                <div className="feedback-item error invoice-feedback-action" key={err}>
                                    <span>{err}</span>
                                    {requestedAdvanceTooHigh && err.includes('funding limit') && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            type="button"
                                            onClick={() => updateForm({ requestedAdvanceAmount: maxAllowedAdvance })}
                                        >
                                            Use {formatCurrency(maxAllowedAdvance, form.currency)}
                                        </button>
                                    )}
                                </div>
                            ))}
                            {warnings.map((warning) => <div className="feedback-item warning" key={warning}>{warning}</div>)}
                        </div>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/invoices')}>Back to invoices</button>
                        <button className="btn btn-primary" type="submit" disabled={!readyForSummary}>
                            Continue to summary
                        </button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div className="card">
                    <Breadcrumbs items={[{ label: 'Invoice details', onClick: goToDetails }, { label: 'Summary' }]} />
                    <div className="card-header">
                        <div>
                            <h2 className="card-title">Invoice summary</h2>
                            <p className="soft-text mt-8">Review the invoice before seeing the advance proposal.</p>
                        </div>
                        <ModelBadge model={rules.financingModel} />
                    </div>
                    <DetailGrid
                        items={[
                            ['Invoice number', form.invoiceNumber],
                            ['Client', `${form.clientName} · ${form.clientEmail}`],
                            ['Invoice amount', formatCurrency(Number(form.amount), form.currency)],
                            ['Requested advance', formatCurrency(Number(form.requestedAdvanceAmount), form.currency)],
                            ['Due date', formatDate(form.dueDate)],
                            ['Payment terms', form.paymentTerms || 'Not specified'],
                            ['Receivable source', form.receivableSource === 'DirectClientInvoice' ? 'Direct client invoice' : 'Freelance platform payout'],
                            ['Optional evidence', form.hasEvidence ? 'Will attach placeholder file' : 'Not attached'],
                        ]}
                    />
                    <div className="form-actions mt-16">
                        <button type="button" className="btn btn-secondary" onClick={goToDetails}>
                            Back to invoice details
                        </button>
                        <button type="button" className="btn btn-primary" onClick={continueToProposal}>
                            Continue to advance proposal
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <>
                        <div className="quote-box quote-box-highlight">
                            <div className="card-header">
                                <h2 className="card-title">Advance proposal</h2>
                                <div className="quote-header-actions">
                                    <span className="quote-pill success">Eligible proposal</span>
                                    <ModelBadge model={rules.financingModel} />
                                </div>
                            </div>
                            <div className="quote-hero">
                                <div>
                                    <span className="quote-hero-label">Available now</span>
                                    <strong>{formatCurrency(calculatedProposal.advanceAmount, form.currency)}</strong>
                                    <p>
                                        From {form.invoiceNumber}, with a fixed {formatCurrency(calculatedProposal.feeAmount, form.currency)} fee.
                                    </p>
                                </div>
                                <div className="quote-hero-side">
                                    <span>{Math.round(calculatedProposal.requestedPercent * 100)}% requested</span>
                                    <strong>{formatCurrency(Number(form.amount), form.currency)}</strong>
                                    <p>invoice value</p>
                                </div>
                            </div>
                            <div className="quote-grid">
                                <div>
                                    <div className="quote-item-label">Flat fee</div>
                                    <div className="quote-item-value">{formatCurrency(calculatedProposal.feeAmount, form.currency)}</div>
                                </div>
                                <div>
                                    <div className="quote-item-label">Repayment / settlement</div>
                                    <div className="quote-item-value green">{formatCurrency(calculatedProposal.expectedRepaymentAmount, form.currency)}</div>
                                </div>
                                <div>
                                    <div className="quote-item-label">Settlement buffer</div>
                                    <div className="quote-item-value">{formatCurrency(calculatedProposal.settlementBufferAmount, form.currency)}</div>
                                </div>
                                <div>
                                    <div className="quote-item-label">Fee rate</div>
                                    <div className="quote-item-value">{(rules.feeRate * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                            <div className="quote-disclaimer">
                                {getModelLabel(rules.financingModel)}.{' '}
                                {rules.financingModel === 'InvoiceFactoring'
                                    ? 'Client confirmation is required and the client pays through Hassil.'
                                    : 'Your client relationship stays private and you repay after collection.'}
                            </div>
                        </div>

                        <div className="card quote-action-card mt-24">
                            <h2 className="card-title">Submit request</h2>
                            <p className="soft-text mt-8">
                                Hassil will create the invoice, submit it, and open this advance request.
                            </p>
                            {submitError && <p className="error-text mt-16">{submitError}</p>}
                            <label className="checkbox-row mt-16">
                                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
                                <span>I accept the advance terms shown above.</span>
                            </label>
                            <div className="form-actions mt-16">
                                {/*<button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>*/}
                                {/*    Back to summary*/}
                                {/*</button>*/}
                                <button type="button" className="btn btn-ghost" onClick={goToDetails}>
                                    Edit invoice details
                                </button>
                                <button className="btn btn-primary" type="button" onClick={submitAdvance} disabled={!accepted || submitting}>
                                    <Icon name="advance" /> {submitting ? 'Submitting...' : 'Submit advance request'}
                                </button>
                            </div>
                        </div>
                </>
            )}
        </>
    )
}
