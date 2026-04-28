export type AccountType = 'SmallBusiness' | 'Freelancer';
export type UserRole = 'User' | 'Admin';
export type UserStatus = 'Active' | 'Suspended';

export type FinancingModel = 'InvoiceDiscounting' | 'InvoiceFactoring';
export type ReceivableSource = 'DirectClientInvoice' | 'FreelancePlatformPayout';
export type RepaymentParty = 'User' | 'Client';

export type InvoiceStatus =
    | 'Draft'
    | 'Submitted'
    | 'AdvanceRequested'
    | 'PendingClientConfirmation'
    | 'Confirmed'
    | 'Disputed'
    | 'PendingReview'
    | 'Approved'
    | 'Disbursed'
    | 'ClientPaymentDetected'
    | 'ClientPaidHassil'
    | 'BufferReleased'
    | 'Paid'
    | 'Rejected';

export type AdvanceStatus =
    | 'PendingClientConfirmation'
    | 'PendingReview'
    | 'Approved'
    | 'Rejected'
    | 'Disbursed'
    | 'ClientPaymentDetected'
    | 'ClientPaidHassil'
    | 'BufferReleased'
    | 'Repaid';

export type ConfirmationStatus = 'Pending' | 'Confirmed' | 'Disputed';
export type AdminDecision = 'Approved' | 'Rejected' | 'RequestMoreInfo';
export type AiRiskLevel = 'Low' | 'Medium' | 'High';
export type AiRecommendedAction = 'Approve' | 'ManualReview' | 'Reject';

export type TransactionType =
    | 'AdvanceDisbursement'
    | 'DetectedIncomingPayment'
    | 'UserRepayment'
    | 'ClientPaymentToHassil'
    | 'PlatformFee'
    | 'BufferRelease'
    | 'TrustScoreAdjustment';

export type TransactionDirection = 'Credit' | 'Debit' | 'Internal';

export interface SmallBusinessProfile {
    businessName: string;
    registrationNumber: string;
    businessBankAccountName?: string;
    businessBankAccountLast4?: string;
}

export interface FreelancerProfile {
    fullName: string;
    personalBankAccountName?: string;
    personalBankAccountLast4?: string;
}

export interface User {
    id: string;
    accountType: AccountType;
    role: UserRole;
    email: string;
    phone?: string;
    country?: string;
    trustScore: number;
    status: UserStatus;
    createdAt: string;
    smallBusinessProfile?: SmallBusinessProfile;
    freelancerProfile?: FreelancerProfile;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    country?: string;
}

export interface ClientConfirmation {
    id: string;
    invoiceId: string;
    token: string;
    clientEmail: string;
    status: ConfirmationStatus;
    clientNote?: string;
    respondedAt?: string;
    expiresAt: string;
}

export interface InvoiceDocument {
    id: string;
    invoiceId: string;
    fileName: string;
    documentType: string;
    uploadedAt: string;
}

export interface Invoice {
    id: string;
    userId: string;
    clientId: string;
    client: Client;
    invoiceNumber: string;
    receivableSource: ReceivableSource;
    amount: number;
    currency: string;
    issueDate: string;
    dueDate: string;
    description?: string;
    paymentTerms?: string;
    status: InvoiceStatus;
    fingerprint: string;
    createdAt: string;
    documents: InvoiceDocument[];
    clientConfirmation?: ClientConfirmation;
    advanceRequestId?: string;
}

export interface AdvanceRequest {
    id: string;
    invoiceId: string;
    userId: string;
    financingModel: FinancingModel;
    repaymentParty: RepaymentParty;
    clientNotificationRequired: boolean;
    requestedPercent: number;
    advanceAmount: number;
    feeRate: number;
    feeAmount: number;
    settlementBufferAmount: number;
    expectedRepaymentAmount: number;
    reviewScore: number;
    approvalMode?: 'Auto' | 'Manual';
    status: AdvanceStatus;
    rejectionReason?: string;
    termsAcceptedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: string;
    userId: string;
    invoiceId?: string;
    advanceRequestId?: string;
    type: TransactionType;
    direction: TransactionDirection;
    amount: number;
    description?: string;
    createdAt: string;
}

export interface TrustScoreEvent {
    id: string;
    userId: string;
    oldScore: number;
    newScore: number;
    reason: string;
    createdAt: string;
}

export interface AiReviewSnapshot {
    id: string;
    advanceRequestId: string;
    riskLevel: AiRiskLevel;
    recommendedAction: AiRecommendedAction;
    summary: string;
    riskFlags: string[];
    createdAt: string;
}

export interface AdminReview {
    id: string;
    advanceRequestId: string;
    reviewerUserId: string;
    decision: AdminDecision;
    notes?: string;
    createdAt: string;
}

export type PageName =
    | 'landing'
    | 'selectType'
    | 'onboarding'
    | 'dashboard'
    | 'invoices'
    | 'newInvoice'
    | 'invoiceDetail'
    | 'advanceRequest'
    | 'advanceDetail'
    | 'clientConfirmation'
    | 'adminReview'
    | 'ledger'
    | 'cashFlow';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface AppState {
    currentUserId: string;
    users: User[];
    clients: Client[];
    invoices: Invoice[];
    advanceRequests: AdvanceRequest[];
    transactions: Transaction[];
    trustScoreEvents: TrustScoreEvent[];
    aiReviewSnapshots: AiReviewSnapshot[];
    adminReviews: AdminReview[];
    currentPage: PageName;
    pageParams: Record<string, string>;
    showDemoSwitcher: boolean;
    toasts: Toast[];
}

export interface AdvanceQuote {
    financingModel: FinancingModel;
    repaymentParty: RepaymentParty;
    clientNotificationRequired: boolean;
    requestedPercent: number;
    advanceAmount: number;
    feeRate: number;
    feeAmount: number;
    settlementBufferAmount: number;
    expectedRepaymentAmount: number;
    maxEligibleInvoiceAmount: number;
    modelLabel: string;
}
