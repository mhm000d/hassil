import type {
    Invoice,
    AdvanceRequest,
    Transaction,
    TrustScoreEvent,
    AiReviewSnapshot,
    AdminReview,
    User,
    Client,
    FinancingModel,
    RepaymentParty,
} from '../types'

export interface ApiResponse<T> {
    data: T
    status: 'success' | 'error'
    message?: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
    {
        id: 'user-ahmed',
        accountType: 'SmallBusiness',
        role: 'User',
        email: 'finance@ahmedstudio.co',
        phone: '+971 50 000 1111',
        country: 'UAE',
        trustScore: 60,
        status: 'Active',
        createdAt: '2026-01-10T00:00:00Z',
        smallBusinessProfile: {
            businessName: 'Ahmed Studio',
            registrationNumber: 'AE-DEMO-2026',
            businessBankAccountName: 'Ahmed Studio LLC',
            businessBankAccountLast4: '4421',
        },
    },
    {
        id: 'user-sara',
        accountType: 'Freelancer',
        role: 'User',
        email: 'sara@saradesigns.io',
        phone: '+966 50 000 3333',
        country: 'Saudi Arabia',
        trustScore: 42,
        status: 'Active',
        createdAt: '2026-02-15T00:00:00Z',
        freelancerProfile: {
            fullName: 'Sara Designs',
            personalBankAccountName: 'Sara Al-Rashid',
            personalBankAccountLast4: '9912',
        },
    },
    {
        id: 'user-mona',
        accountType: 'Freelancer',
        role: 'User',
        email: 'mona.ux@example.com',
        phone: '+20 100 000 2222',
        country: 'Egypt',
        trustScore: 72,
        status: 'Active',
        createdAt: '2026-02-01T00:00:00Z',
        freelancerProfile: {
            fullName: 'Mona UX Studio',
            personalBankAccountName: 'Mona Ahmed',
            personalBankAccountLast4: '7781',
        },
    },
    {
        id: 'user-admin',
        accountType: 'SmallBusiness',
        role: 'Admin',
        email: 'admin@hassil.io',
        trustScore: 100,
        status: 'Active',
        createdAt: '2025-12-01T00:00:00Z',
        smallBusinessProfile: {
            businessName: 'Hassil Admin',
            registrationNumber: 'ADMIN-001',
        },
    },
]

export const mockClients: Client[] = [
    { id: 'client-noura', name: 'Noura Retail Group', email: 'ap@nouraretail.sa', country: 'Saudi Arabia' },
    { id: 'client-nabd', name: 'Nabd Freelance Marketplace', email: 'finance@nabd.io', country: 'UAE' },
    { id: 'client-lynx', name: 'Lynx Digital', email: 'finance@lynxdigital.qa', country: 'Qatar' },
]

export const mockInvoices: Invoice[] = [
    {
        id: 'inv-001',
        userId: 'user-ahmed',
        clientId: 'client-noura',
        client: mockClients[0],
        invoiceNumber: 'AHM-2026-018',
        receivableSource: 'DirectClientInvoice',
        amount: 18000,
        currency: 'USD',
        issueDate: '2026-03-15',
        dueDate: '2026-06-12',
        description: 'Brand strategy and design services Q1 2026',
        paymentTerms: 'Net 45',
        status: 'Disbursed',
        fingerprint: 'fp-001',
        createdAt: '2026-03-15T10:00:00Z',
        documents: [{ id: 'doc-001', invoiceId: 'inv-001', fileName: 'invoice-evidence.pdf', documentType: 'Supporting Evidence', uploadedAt: '2026-03-15T10:05:00Z' }],
        advanceRequestId: 'adv-001',
    },
    {
        id: 'inv-002',
        userId: 'user-ahmed',
        clientId: 'client-nabd',
        client: mockClients[1],
        invoiceNumber: 'AHM-2026-019',
        receivableSource: 'DirectClientInvoice',
        amount: 12400,
        currency: 'USD',
        issueDate: '2026-04-01',
        dueDate: '2026-06-20',
        description: 'UI/UX consulting for marketplace redesign',
        paymentTerms: 'Net 30',
        status: 'PendingClientConfirmation',
        fingerprint: 'fp-002',
        createdAt: '2026-04-01T09:00:00Z',
        documents: [{ id: 'doc-002', invoiceId: 'inv-002', fileName: 'contract-signed.pdf', documentType: 'Signed Contract', uploadedAt: '2026-04-01T09:10:00Z' }],
        advanceRequestId: 'adv-002',
        clientConfirmation: {
            id: 'conf-001',
            invoiceId: 'inv-002',
            token: 'confirm-token-abc123',
            clientEmail: 'finance@nabd.io',
            status: 'Pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
    },
    {
        id: 'inv-003',
        userId: 'user-ahmed',
        clientId: 'client-noura',
        client: mockClients[0],
        invoiceNumber: 'SAR-2026-028',
        receivableSource: 'DirectClientInvoice',
        amount: 2900,
        currency: 'USD',
        issueDate: '2026-04-10',
        dueDate: '2026-05-25',
        description: 'Social media campaign assets',
        paymentTerms: 'Net 15',
        status: 'Submitted',
        fingerprint: 'fp-003',
        createdAt: '2026-04-10T11:00:00Z',
        documents: [],
    },
    {
        id: 'inv-004',
        userId: 'user-ahmed',
        clientId: 'client-noura',
        client: mockClients[0],
        invoiceNumber: 'AHM-2026-020',
        receivableSource: 'DirectClientInvoice',
        amount: 8500,
        currency: 'USD',
        issueDate: '2026-02-01',
        dueDate: '2026-03-15',
        description: 'Annual brand refresh package',
        paymentTerms: 'Net 45',
        status: 'Paid',
        fingerprint: 'fp-004',
        createdAt: '2026-02-01T08:00:00Z',
        documents: [{ id: 'doc-004', invoiceId: 'inv-004', fileName: 'invoice-evidence.pdf', documentType: 'Supporting Evidence', uploadedAt: '2026-02-01T08:05:00Z' }],
        advanceRequestId: 'adv-003',
    },
    {
        id: 'inv-005',
        userId: 'user-mona',
        clientId: 'client-lynx',
        client: mockClients[2],
        invoiceNumber: 'MON-2026-011',
        receivableSource: 'FreelancePlatformPayout',
        amount: 3200,
        currency: 'USD',
        issueDate: '2026-04-05',
        dueDate: '2026-05-20',
        description: 'Freelance UX design sprint',
        paymentTerms: 'Platform payout hold',
        status: 'PendingReview',
        fingerprint: 'fp-005',
        createdAt: '2026-04-05T14:00:00Z',
        documents: [{ id: 'doc-005', invoiceId: 'inv-005', fileName: 'platform-payout-proof.pdf', documentType: 'Platform Payout Proof', uploadedAt: '2026-04-05T14:10:00Z' }],
        advanceRequestId: 'adv-004',
    },
    {
        id: 'inv-006',
        userId: 'user-sara',
        clientId: 'client-nabd',
        client: mockClients[1],
        invoiceNumber: 'SAR-2026-028',
        receivableSource: 'FreelancePlatformPayout',
        amount: 2900,
        currency: 'USD',
        issueDate: '2026-04-08',
        dueDate: '2026-05-28',
        description: 'Brand identity and social media kit',
        paymentTerms: 'Platform payout hold',
        status: 'PendingReview',
        fingerprint: 'fp-006',
        createdAt: '2026-04-08T10:00:00Z',
        documents: [{ id: 'doc-006', invoiceId: 'inv-006', fileName: 'platform-payout-proof.pdf', documentType: 'Platform Payout Proof', uploadedAt: '2026-04-08T10:10:00Z' }],
        advanceRequestId: 'adv-005',
    },
    {
        id: 'inv-007',
        userId: 'user-ahmed',
        clientId: 'client-noura',
        client: mockClients[0],
        invoiceNumber: 'AHM-2026-016',
        receivableSource: 'DirectClientInvoice',
        amount: 7600,
        currency: 'USD',
        issueDate: '2026-01-10',
        dueDate: '2026-02-28',
        description: 'Motion graphics package — rejected due to duplicate fingerprint.',
        paymentTerms: 'Net 30',
        status: 'Rejected',
        fingerprint: 'fp-007',
        createdAt: '2026-01-10T08:00:00Z',
        documents: [],
        advanceRequestId: 'adv-006',
    },
]

export const mockAdvanceRequests: AdvanceRequest[] = [
    {
        id: 'adv-001',
        invoiceId: 'inv-001',
        userId: 'user-ahmed',
        financingModel: 'InvoiceFactoring',
        repaymentParty: 'Client',
        clientNotificationRequired: true,
        requestedPercent: 0.8,
        advanceAmount: 14400,
        feeRate: 0.02,
        feeAmount: 288,
        settlementBufferAmount: 3312,
        expectedRepaymentAmount: 18000,
        reviewScore: 82,
        approvalMode: 'Auto',
        status: 'Disbursed',
        termsAcceptedAt: '2026-03-16T10:00:00Z',
        createdAt: '2026-03-16T10:00:00Z',
        updatedAt: '2026-03-17T09:00:00Z',
    },
    {
        id: 'adv-002',
        invoiceId: 'inv-002',
        userId: 'user-ahmed',
        financingModel: 'InvoiceFactoring',
        repaymentParty: 'Client',
        clientNotificationRequired: true,
        requestedPercent: 0.8,
        advanceAmount: 9920,
        feeRate: 0.02,
        feeAmount: 198,
        settlementBufferAmount: 2282,
        expectedRepaymentAmount: 12400,
        reviewScore: 74,
        approvalMode: 'Manual',
        status: 'PendingClientConfirmation',
        termsAcceptedAt: '2026-04-02T09:00:00Z',
        createdAt: '2026-04-02T09:00:00Z',
        updatedAt: '2026-04-02T09:00:00Z',
    },
    {
        id: 'adv-003',
        invoiceId: 'inv-004',
        userId: 'user-ahmed',
        financingModel: 'InvoiceFactoring',
        repaymentParty: 'Client',
        clientNotificationRequired: true,
        requestedPercent: 0.8,
        advanceAmount: 6800,
        feeRate: 0.02,
        feeAmount: 136,
        settlementBufferAmount: 1564,
        expectedRepaymentAmount: 8500,
        reviewScore: 88,
        approvalMode: 'Auto',
        status: 'Repaid',
        termsAcceptedAt: '2026-02-02T08:00:00Z',
        createdAt: '2026-02-02T08:00:00Z',
        updatedAt: '2026-03-16T12:00:00Z',
    },
    {
        id: 'adv-004',
        invoiceId: 'inv-005',
        userId: 'user-mona',
        financingModel: 'InvoiceDiscounting',
        repaymentParty: 'User',
        clientNotificationRequired: false,
        requestedPercent: 0.8,
        advanceAmount: 2560,
        feeRate: 0.025,
        feeAmount: 64,
        settlementBufferAmount: 576,
        expectedRepaymentAmount: 3200,
        reviewScore: 68,
        approvalMode: 'Manual',
        status: 'PendingReview',
        termsAcceptedAt: '2026-04-06T14:00:00Z',
        createdAt: '2026-04-06T14:00:00Z',
        updatedAt: '2026-04-06T14:00:00Z',
    },
    {
        id: 'adv-005',
        invoiceId: 'inv-006',
        userId: 'user-sara',
        financingModel: 'InvoiceDiscounting',
        repaymentParty: 'User',
        clientNotificationRequired: false,
        requestedPercent: 0.75,
        advanceAmount: 2175,
        feeRate: 0.025,
        feeAmount: 54,
        settlementBufferAmount: 671,
        expectedRepaymentAmount: 2900,
        reviewScore: 65,
        approvalMode: 'Manual',
        status: 'PendingReview',
        termsAcceptedAt: '2026-04-09T10:00:00Z',
        createdAt: '2026-04-09T10:00:00Z',
        updatedAt: '2026-04-09T10:00:00Z',
    },
    {
        id: 'adv-006',
        invoiceId: 'inv-007',
        userId: 'user-ahmed',
        financingModel: 'InvoiceFactoring',
        repaymentParty: 'Client',
        clientNotificationRequired: true,
        requestedPercent: 0.8,
        advanceAmount: 6080,
        feeRate: 0.02,
        feeAmount: 122,
        settlementBufferAmount: 1398,
        expectedRepaymentAmount: 7600,
        reviewScore: 10,
        approvalMode: 'Manual',
        status: 'Rejected',
        rejectionReason: 'No supporting evidence attached. Rule engine rejected this request.',
        termsAcceptedAt: '2026-01-11T08:00:00Z',
        createdAt: '2026-01-11T08:00:00Z',
        updatedAt: '2026-01-11T09:00:00Z',
    },
]

export const mockTransactions: Transaction[] = [
    {
        id: 'tx-001',
        userId: 'user-ahmed',
        invoiceId: 'inv-001',
        advanceRequestId: 'adv-001',
        type: 'AdvanceDisbursement',
        direction: 'Credit',
        amount: 14400,
        description: '$14,400 sent to Ahmed Studio bank account.',
        createdAt: '2026-03-17T09:00:00Z',
    },
    {
        id: 'tx-002',
        userId: 'user-ahmed',
        invoiceId: 'inv-004',
        advanceRequestId: 'adv-003',
        type: 'ClientPaymentToHassil',
        direction: 'Credit',
        amount: 8500,
        description: 'Client paid the invoice to Hassil.',
        createdAt: '2026-03-14T12:00:00Z',
    },
    {
        id: 'tx-003',
        userId: 'user-ahmed',
        invoiceId: 'inv-004',
        advanceRequestId: 'adv-003',
        type: 'BufferRelease',
        direction: 'Credit',
        amount: 1564,
        description: 'Remaining buffer released to Ahmed Studio.',
        createdAt: '2026-03-16T12:00:00Z',
    },
    {
        id: 'tx-004',
        userId: 'user-ahmed',
        invoiceId: 'inv-004',
        advanceRequestId: 'adv-003',
        type: 'PlatformFee',
        direction: 'Debit',
        amount: 136,
        description: 'Fixed fee collected from settlement.',
        createdAt: '2026-03-14T12:05:00Z',
    },
    {
        id: 'tx-005',
        userId: 'user-ahmed',
        type: 'TrustScoreAdjustment',
        direction: 'Internal',
        amount: 10,
        description: 'Completed factoring cycle and buffer release.',
        createdAt: '2026-03-16T12:01:00Z',
    },
    {
        id: 'tx-006',
        userId: 'user-mona',
        invoiceId: 'inv-005',
        advanceRequestId: 'adv-004',
        type: 'AdvanceDisbursement',
        direction: 'Credit',
        amount: 2560,
        description: '$2,560 sent to Mona bank account.',
        createdAt: '2026-04-07T10:00:00Z',
    },
]

export const mockTrustScoreEvents: TrustScoreEvent[] = [
    {
        id: 'score-001',
        userId: 'user-ahmed',
        oldScore: 50,
        newScore: 60,
        reason: 'Completed factoring cycle and buffer release.',
        createdAt: '2026-03-16T12:01:00Z',
    },
    {
        id: 'score-002',
        userId: 'user-ahmed',
        oldScore: 45,
        newScore: 50,
        reason: 'Repaid discounting advance after client payment detection.',
        createdAt: '2026-02-20T08:00:00Z',
    },
]

export const mockAiSnapshots: AiReviewSnapshot[] = [
    {
        id: 'ai-001',
        advanceRequestId: 'adv-002',
        riskLevel: 'Medium',
        recommendedAction: 'ManualReview',
        summary: 'Invoice amount is within trust limits. Client confirmation is pending. Review score is 74 — below the auto-approve threshold of 75. Supporting document is attached. Recommend manual review before disbursement.',
        riskFlags: ['Review score below auto-approve threshold (74/100)', 'Client confirmation still pending'],
        createdAt: '2026-04-02T09:05:00Z',
    },
    {
        id: 'ai-002',
        advanceRequestId: 'adv-004',
        riskLevel: 'Medium',
        recommendedAction: 'ManualReview',
        summary: 'Freelancer discounting request. Score is 68 — manual review required. No client notification needed. Platform payout proof is attached.',
        riskFlags: ['Review score below auto-approve threshold (68/100)', 'Freelancer account — higher repayment risk'],
        createdAt: '2026-04-06T14:05:00Z',
    },
    {
        id: 'ai-003',
        advanceRequestId: 'adv-005',
        riskLevel: 'Medium',
        recommendedAction: 'ManualReview',
        summary: 'Sara Designs freelancer request. Trust score is 42 — below the recommended threshold. Score is 65. Platform payout proof attached. Recommend manual review.',
        riskFlags: ['Trust score below recommended threshold (42/100)', 'Review score below auto-approve threshold (65/100)'],
        createdAt: '2026-04-09T10:05:00Z',
    },
    {
        id: 'ai-004',
        advanceRequestId: 'adv-006',
        riskLevel: 'High',
        recommendedAction: 'Reject',
        summary: 'No supporting evidence attached. Review score is critically low at 10/100. Rule engine has already rejected this request. No further action recommended.',
        riskFlags: ['Supporting document is missing', 'Review score critically low (10/100)', 'Due date is in the past'],
        createdAt: '2026-01-11T08:05:00Z',
    },
]

export const mockAdminReviews: AdminReview[] = []

// ─── In-memory state ──────────────────────────────────────────────────────────

let _invoices = [...mockInvoices]
let _advances = [...mockAdvanceRequests]
let _transactions = [...mockTransactions]
let _trustEvents = [...mockTrustScoreEvents]
let _aiSnapshots = [...mockAiSnapshots]
let _adminReviews = [...mockAdminReviews]

function ok<T>(data: T): ApiResponse<T> {
    return { data, status: 'success' }
}

// ─── Mock API ─────────────────────────────────────────────────────────────────

export const mockApi = {
    // Users
    getUser(id: string): Promise<ApiResponse<User | undefined>> {
        return Promise.resolve(ok(mockUsers.find((u) => u.id === id)))
    },
    listUsers(): Promise<ApiResponse<User[]>> {
        return Promise.resolve(ok(mockUsers))
    },

    // Invoices
    listInvoices(userId?: string): Promise<ApiResponse<Invoice[]>> {
        const result = userId ? _invoices.filter((inv) => inv.userId === userId) : _invoices
        return Promise.resolve(ok(result))
    },
    getInvoice(id: string): Promise<ApiResponse<Invoice | undefined>> {
        return Promise.resolve(ok(_invoices.find((inv) => inv.id === id)))
    },
    createInvoice(invoice: Invoice): Promise<ApiResponse<Invoice>> {
        _invoices = [invoice, ..._invoices]
        return Promise.resolve(ok(invoice))
    },
    updateInvoice(id: string, patch: Partial<Invoice>): Promise<ApiResponse<Invoice | undefined>> {
        _invoices = _invoices.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv))
        return Promise.resolve(ok(_invoices.find((inv) => inv.id === id)))
    },

    // Advance requests
    listAdvanceRequests(userId?: string): Promise<ApiResponse<AdvanceRequest[]>> {
        const result = userId ? _advances.filter((adv) => adv.userId === userId) : _advances
        return Promise.resolve(ok(result))
    },
    getAdvanceRequest(id: string): Promise<ApiResponse<AdvanceRequest | undefined>> {
        return Promise.resolve(ok(_advances.find((adv) => adv.id === id)))
    },
    createAdvanceRequest(advance: AdvanceRequest): Promise<ApiResponse<AdvanceRequest>> {
        _advances = [advance, ..._advances]
        return Promise.resolve(ok(advance))
    },
    updateAdvanceRequest(id: string, patch: Partial<AdvanceRequest>): Promise<ApiResponse<AdvanceRequest | undefined>> {
        _advances = _advances.map((adv) => (adv.id === id ? { ...adv, ...patch } : adv))
        return Promise.resolve(ok(_advances.find((adv) => adv.id === id)))
    },

    // Transactions
    listTransactions(userId?: string): Promise<ApiResponse<Transaction[]>> {
        const result = userId ? _transactions.filter((tx) => tx.userId === userId) : _transactions
        return Promise.resolve(ok(result))
    },
    addTransaction(tx: Transaction): Promise<ApiResponse<Transaction>> {
        _transactions = [tx, ..._transactions]
        return Promise.resolve(ok(tx))
    },

    // Trust score events
    listTrustScoreEvents(userId?: string): Promise<ApiResponse<TrustScoreEvent[]>> {
        const result = userId ? _trustEvents.filter((e) => e.userId === userId) : _trustEvents
        return Promise.resolve(ok(result))
    },
    addTrustScoreEvent(event: TrustScoreEvent): Promise<ApiResponse<TrustScoreEvent>> {
        _trustEvents = [event, ..._trustEvents]
        return Promise.resolve(ok(event))
    },

    // AI snapshots
    listAiSnapshots(): Promise<ApiResponse<AiReviewSnapshot[]>> {
        return Promise.resolve(ok(_aiSnapshots))
    },
    getAiSnapshot(advanceRequestId: string): Promise<ApiResponse<AiReviewSnapshot | undefined>> {
        return Promise.resolve(ok(_aiSnapshots.find((s) => s.advanceRequestId === advanceRequestId)))
    },
    addAiSnapshot(snapshot: AiReviewSnapshot): Promise<ApiResponse<AiReviewSnapshot>> {
        _aiSnapshots = [snapshot, ..._aiSnapshots]
        return Promise.resolve(ok(snapshot))
    },

    // Admin reviews
    listAdminReviews(): Promise<ApiResponse<AdminReview[]>> {
        return Promise.resolve(ok(_adminReviews))
    },
    addAdminReview(review: AdminReview): Promise<ApiResponse<AdminReview>> {
        _adminReviews = [review, ..._adminReviews]
        return Promise.resolve(ok(review))
    },

    // Client confirmation
    getClientConfirmation(token: string): Promise<ApiResponse<{ invoice: Invoice; confirmation: Invoice['clientConfirmation'] } | undefined>> {
        const invoice = _invoices.find((inv) => inv.clientConfirmation?.token === token)
        if (!invoice) return Promise.resolve(ok(undefined))
        return Promise.resolve(ok({ invoice, confirmation: invoice.clientConfirmation }))
    },
    updateClientConfirmation(token: string, patch: Partial<NonNullable<Invoice['clientConfirmation']>>): Promise<ApiResponse<null>> {
        _invoices = _invoices.map((inv) =>
            inv.clientConfirmation?.token === token
                ? { ...inv, clientConfirmation: { ...inv.clientConfirmation!, ...patch } }
                : inv,
        )
        return Promise.resolve(ok(null))
    },

    // Helpers
    getClients(): Promise<ApiResponse<Client[]>> {
        return Promise.resolve(ok(mockClients))
    },

    // Sync helper — reads live in-memory state without a Promise
    getPendingConfirmationToken(): string | null {
        return _invoices.find((inv) => inv.clientConfirmation?.status === 'Pending')?.clientConfirmation?.token ?? null
    },
}

// ─── Auth helpers (localStorage-backed) ──────────────────────────────────────

const USERS_KEY = 'hassil_registered_users'

interface RegisteredUser {
    email: string
    passwordHash: string // stored as plain text for demo purposes
    name: string
    displayName: string  // company name for SMB, same as name for Freelancer
    accountType: 'Freelancer' | 'SmallBusiness'
}

function loadRegisteredUsers(): RegisteredUser[] {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    } catch {
        return []
    }
}

function saveRegisteredUsers(users: RegisteredUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const authApi = {
    register(user: RegisteredUser): { success: boolean; error?: string } {
        const users = loadRegisteredUsers()
        if (users.find((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
            return { success: false, error: 'An account with this email already exists.' }
        }
        saveRegisteredUsers([...users, user])
        return { success: true }
    },

    login(email: string, password: string): { success: boolean; user?: RegisteredUser; error?: string } {
        const users = loadRegisteredUsers()
        const found = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password,
        )
        if (!found) {
            return { success: false, error: 'Invalid email or password.' }
        }
        return { success: true, user: found }
    },

    updateDisplayName(email: string, displayName: string): void {
        const users = loadRegisteredUsers()
        saveRegisteredUsers(users.map((u) =>
            u.email.toLowerCase() === email.toLowerCase() ? { ...u, displayName } : u,
        ))
    },
}

// ─── Utility helpers (shared with pages) ─────────────────────────────────────

export function generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatDate(dateStr: string) {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
    }
    return map[status] ?? status
}

export function getStatusColor(status: string): string {
    if (['Paid', 'Approved', 'Repaid', 'BufferReleased', 'Confirmed'].includes(status)) return 'status-success'
    if (['PendingClientConfirmation', 'PendingReview', 'ClientPaymentDetected', 'ClientPaidHassil'].includes(status)) return 'status-pending'
    if (['Submitted', 'AdvanceRequested', 'Disbursed'].includes(status)) return 'status-warning'
    if (['Rejected', 'Disputed'].includes(status)) return 'status-error'
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

export function calculateQuote(user: User, invoice: Invoice): {
    financingModel: FinancingModel
    repaymentParty: RepaymentParty
    clientNotificationRequired: boolean
    requestedPercent: number
    advanceAmount: number
    feeRate: number
    feeAmount: number
    settlementBufferAmount: number
    expectedRepaymentAmount: number
    maxEligibleInvoiceAmount: number
} {
    const isFactoring = user.accountType === 'SmallBusiness'
    const financingModel: FinancingModel = isFactoring ? 'InvoiceFactoring' : 'InvoiceDiscounting'
    const requestedPercent = isFactoring ? 0.8 : 0.75
    const feeRate = isFactoring ? 0.02 : 0.025
    const advanceAmount = Math.round(invoice.amount * requestedPercent)
    const feeAmount = Math.round(advanceAmount * feeRate)
    const settlementBufferAmount = invoice.amount - advanceAmount - feeAmount
    const expectedRepaymentAmount = invoice.amount
    const maxEligibleInvoiceAmount = user.trustScore >= 75 ? 50000 : user.trustScore >= 50 ? 25000 : 10000
    return {
        financingModel,
        repaymentParty: isFactoring ? 'Client' : 'User',
        clientNotificationRequired: isFactoring,
        requestedPercent,
        advanceAmount,
        feeRate,
        feeAmount,
        settlementBufferAmount,
        expectedRepaymentAmount,
        maxEligibleInvoiceAmount,
    }
}

export function scoreAdvance(user: User, invoice: Invoice, hasEvidence: boolean, duplicate: boolean): number {
    let score = 100
    if (!hasEvidence) score -= 20
    if (duplicate) score -= 30
    if (user.trustScore < 50) score -= 20
    if (user.trustScore < 30) score -= 10
    if (invoice.amount > 20000) score -= 10
    if (daysUntilDate(invoice.dueDate) > 75) score -= 10
    return Math.max(0, Math.min(100, score))
}

export function getReviewFlags(user: User, invoice: Invoice, score: number): string[] {
    const flags: string[] = []
    if (invoice.documents.length === 0) flags.push('Supporting document is missing')
    if (score < 75) flags.push(`Review score below auto-approve threshold (${score}/100)`)
    if (user.trustScore < 50) flags.push('Trust score below recommended threshold')
    if (invoice.amount > 20000) flags.push('Invoice amount exceeds standard limit')
    if (daysUntilDate(invoice.dueDate) > 75) flags.push('Long payment terms — extra review recommended')
    return flags
}

export function getNextSimulationLabel(status: AdvanceRequest['status'], model: FinancingModel): string | null {
    if (status === 'Approved') return 'Simulate disbursement'
    if (model === 'InvoiceFactoring') {
        if (status === 'Disbursed') return 'Simulate client payment'
        if (status === 'ClientPaidHassil') return 'Simulate buffer release'
    } else {
        if (status === 'Disbursed') return 'Simulate payment detection'
        if (status === 'ClientPaymentDetected') return 'Simulate repayment'
    }
    return null
}
