import type {
  AccountType,
  AdvanceQuote,
  AiRecommendedAction,
  AiReviewSnapshot,
  AiRiskLevel,
  FinancingModel,
  Invoice,
  User,
} from './types';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function daysUntilDate(dateStr: string): number {
  const now = new Date();
  const due = new Date(`${dateStr}T12:00:00`);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createFingerprint(
  invoiceNumber: string,
  clientEmail: string,
  amount: number,
  dueDate: string,
  source: string,
): string {
  const raw = `${invoiceNumber.trim().toLowerCase()}|${clientEmail.trim().toLowerCase()}|${amount.toFixed(2)}|${dueDate}|${source}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp-${Math.abs(hash).toString(16)}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Draft: 'status-draft',
    Submitted: 'status-pending',
    AdvanceRequested: 'status-pending',
    PendingClientConfirmation: 'status-pending',
    PendingReview: 'status-warning',
    Confirmed: 'status-success',
    Disputed: 'status-error',
    Approved: 'status-success',
    Disbursed: 'status-active',
    ClientPaymentDetected: 'status-active',
    ClientPaidHassil: 'status-active',
    BufferReleased: 'status-active',
    Repaid: 'status-success',
    Paid: 'status-success',
    Rejected: 'status-error',
  };
  return map[status] || 'status-draft';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    Draft: 'Draft',
    Submitted: 'Submitted',
    AdvanceRequested: 'Advance Requested',
    PendingClientConfirmation: 'Awaiting Client',
    PendingReview: 'Under Review',
    Confirmed: 'Confirmed',
    Disputed: 'Disputed',
    Approved: 'Approved',
    Disbursed: 'Funded',
    ClientPaymentDetected: 'Client Paid User',
    ClientPaidHassil: 'Client Paid Hassil',
    BufferReleased: 'Buffer Released',
    Repaid: 'Repaid',
    Paid: 'Completed',
    Rejected: 'Rejected',
  };
  return map[status] || status;
}

export function getNextSimulationLabel(status: string, model: string): string {
  if (model === 'InvoiceFactoring') {
    if (status === 'Approved') return 'Simulate Advance Disbursement';
    if (status === 'Disbursed') return 'Simulate Client Pays Hassil';
    if (status === 'ClientPaidHassil') return 'Simulate Buffer Release';
  } else {
    if (status === 'Approved') return 'Simulate Advance Disbursement';
    if (status === 'Disbursed') return 'Simulate Client Payment Detected';
    if (status === 'ClientPaymentDetected') return 'Simulate User Repayment';
  }
  return '';
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Building';
}

export function getTrustScoreColor(score: number): string {
  if (score >= 80) return '#1a9e7a';
  if (score >= 60) return '#1a9e7a';
  if (score >= 40) return '#d97706';
  return '#e05252';
}

export function getUserDisplayName(user: User): string {
  if (user.role === 'Admin') return 'Admin Reviewer';
  if (user.accountType === 'SmallBusiness') return user.smallBusinessProfile?.businessName || 'Small Business';
  return user.freelancerProfile?.fullName || 'Freelancer';
}

export function getModelLabel(model: FinancingModel): string {
  return model === 'InvoiceFactoring' ? 'Invoice Factoring' : 'Invoice Discounting';
}

export function getRules(accountType: AccountType, trustScore: number) {
  if (accountType === 'Freelancer') {
    if (trustScore >= 80) return { maxAdvancePercent: 0.9, maxInvoice: 5000, feeRate: 0.02 };
    if (trustScore >= 50) return { maxAdvancePercent: 0.8, maxInvoice: 3000, feeRate: 0.035 };
    return { maxAdvancePercent: 0.7, maxInvoice: 1000, feeRate: 0.045 };
  }

  if (trustScore >= 80) return { maxAdvancePercent: 0.95, maxInvoice: 50000, feeRate: 0.012 };
  if (trustScore >= 50) return { maxAdvancePercent: 0.9, maxInvoice: 25000, feeRate: 0.02 };
  return { maxAdvancePercent: 0.8, maxInvoice: 10000, feeRate: 0.032 };
}

export function calculateQuote(user: User, invoice: Invoice): AdvanceQuote {
  const rules = getRules(user.accountType, user.trustScore);
  const financingModel: FinancingModel = user.accountType === 'Freelancer' ? 'InvoiceDiscounting' : 'InvoiceFactoring';
  const repaymentParty = financingModel === 'InvoiceFactoring' ? 'Client' : 'User';
  const requestedPercent = rules.maxAdvancePercent;
  const advanceAmount = roundMoney(invoice.amount * requestedPercent);
  const feeAmount = roundMoney(invoice.amount * rules.feeRate);
  const settlementBufferAmount = financingModel === 'InvoiceFactoring' ? roundMoney(invoice.amount - advanceAmount - feeAmount) : 0;
  const expectedRepaymentAmount = financingModel === 'InvoiceFactoring' ? invoice.amount : roundMoney(advanceAmount + feeAmount);

  return {
    financingModel,
    repaymentParty,
    clientNotificationRequired: financingModel === 'InvoiceFactoring',
    requestedPercent,
    advanceAmount,
    feeRate: rules.feeRate,
    feeAmount,
    settlementBufferAmount,
    expectedRepaymentAmount,
    maxEligibleInvoiceAmount: rules.maxInvoice,
    modelLabel: getModelLabel(financingModel),
  };
}

export function scoreAdvance(user: User, invoice: Invoice, model: FinancingModel, termsAccepted: boolean, duplicate = false): number {
  let score = 100;
  const rules = getRules(user.accountType, user.trustScore);
  const days = daysUntilDate(invoice.dueDate);

  if (user.status !== 'Active') score -= 100;
  if (!termsAccepted) score -= 100;
  if (duplicate) score -= 60;
  if (invoice.documents.length === 0) score -= 25;
  if (days > 90) score -= 40;
  if (days < 0) score -= 100;
  if (user.trustScore < 50) score -= 20;
  if (invoice.amount > rules.maxInvoice) score -= 35;

  if (model === 'InvoiceFactoring') {
    if (invoice.clientConfirmation?.status === 'Disputed') score -= 100;
    if (invoice.clientConfirmation?.status !== 'Confirmed') score -= 35;
  }

  if (model === 'InvoiceDiscounting' && invoice.receivableSource === 'FreelancePlatformPayout') score += 5;

  return clamp(score, 0, 100);
}

export function decideAdvance(user: User, invoice: Invoice, score: number, model: FinancingModel): 'Rejected' | 'PendingClientConfirmation' | 'Approved' | 'PendingReview' {
  if (score < 40) return 'Rejected';
  if (model === 'InvoiceFactoring' && invoice.clientConfirmation?.status !== 'Confirmed') return 'PendingClientConfirmation';
  if (score >= 75 && user.trustScore >= 50 && invoice.documents.length > 0) return 'Approved';
  return 'PendingReview';
}

export function buildAiSnapshot(advanceRequestId: string, score: number, flags: string[] = []): AiReviewSnapshot {
  let riskLevel: AiRiskLevel = 'High';
  let recommendedAction: AiRecommendedAction = 'Reject';

  if (score >= 75) {
    riskLevel = 'Low';
    recommendedAction = 'Approve';
  } else if (score >= 50) {
    riskLevel = 'Medium';
    recommendedAction = 'ManualReview';
  }

  const summary =
    riskLevel === 'Low'
      ? 'Evidence is present, the amount fits the limit, and the trust score supports approval.'
      : riskLevel === 'Medium'
        ? 'The request may be valid, but one or more signals need reviewer attention.'
        : 'High-risk signals are present. Ask for stronger evidence before approval.';

  return {
    id: generateId('ai'),
    advanceRequestId,
    riskLevel,
    recommendedAction,
    summary,
    riskFlags: flags.length ? flags : riskLevel === 'Low' ? [] : ['Manual review recommended'],
    createdAt: new Date().toISOString(),
  };
}

export function getReviewFlags(user: User, invoice: Invoice, score: number, model: FinancingModel): string[] {
  const flags: string[] = [];
  const rules = getRules(user.accountType, user.trustScore);
  const days = daysUntilDate(invoice.dueDate);
  if (invoice.documents.length === 0) flags.push('Supporting document is missing');
  if (user.trustScore < 50) flags.push('Trust score is still building');
  if (invoice.amount > rules.maxInvoice * 0.85) flags.push('Invoice is close to current limit');
  if (days > 90) flags.push('Due date is more than 90 days away');
  if (days < 0) flags.push('Due date is in the past');
  if (model === 'InvoiceFactoring' && invoice.clientConfirmation?.status !== 'Confirmed') flags.push('Client confirmation is still pending');
  if (score < 75 && flags.length === 0) flags.push('Score requires human confirmation');
  return flags;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
