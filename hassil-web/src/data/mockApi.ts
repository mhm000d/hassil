import type { Client, Invoice, InvoiceDocument, ClientConfirmation, FinancingModel, RepaymentParty, RouteName } from '../types'

export interface DemoLoginRequest {
    email: string
}

export interface OnboardingProfile {
    email: string
    accountType: 'Freelancer' | 'SmallBusiness'
    name: string
    phone?: string
    country?: string
}

export interface InvoiceCreateRequest {
    clientName: string
    clientEmail: string
    clientCountry: string
    invoiceNumber: string
    receivableSource: Invoice['receivableSource']
    amount: number
    currency: string
    issueDate: string
    dueDate: string
    description?: string
    paymentTerms?: string
}

export interface AdvanceQuoteRequest {
    invoiceId: string
    termsAccepted: boolean
}

export interface AdvanceRequestPayload extends AdvanceQuoteRequest {
    accepted: boolean
}

export interface ApiResponse<T> {
    data: T
    status: 'success' | 'error'
    message?: string
}

export const mockApi = {
    demoLogin(request: DemoLoginRequest): Promise<ApiResponse<{ userId: string }>> {
        return Promise.resolve({ data: { userId: 'user-ahmed' }, status: 'success' })
    },

    seedDemoData(): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    onboardingSmallBusiness(request: OnboardingProfile): Promise<ApiResponse<{ userId: string }>> {
        return Promise.resolve({ data: { userId: 'user-small-business' }, status: 'success' })
    },

    onboardingFreelancer(request: OnboardingProfile): Promise<ApiResponse<{ userId: string }>> {
        return Promise.resolve({ data: { userId: 'user-freelancer' }, status: 'success' })
    },

    getCurrentUser(): Promise<ApiResponse<{ userId: string; email: string; trustScore: number }>> {
        return Promise.resolve({ data: { userId: 'user-ahmed', email: 'finance@ahmedstudio.co', trustScore: 60 }, status: 'success' })
    },

    createInvoice(request: InvoiceCreateRequest): Promise<ApiResponse<{ invoiceId: string }>> {
        return Promise.resolve({ data: { invoiceId: 'inv-demo' }, status: 'success' })
    },

    listInvoices(): Promise<ApiResponse<Invoice[]>> {
        return Promise.resolve({ data: [], status: 'success' })
    },

    getInvoice(id: string): Promise<ApiResponse<Invoice>> {
        const invoice: Invoice = {
            id,
            invoiceNumber: 'INV-001',
            receivableSource: 'DirectClientInvoice',
            amount: 15000,
            currency: 'USD',
            issueDate: '2026-04-01',
            dueDate: '2026-05-01',
            description: 'Brand strategy and design services',
            paymentTerms: 'Net 30',
            status: 'Submitted',
            fingerprint: 'demo-fingerprint',
            createdAt: new Date().toISOString(),
            client: { id: 'client-demo', name: 'Demo Client', email: 'client@demo.io', country: 'UAE' },
            documents: [],
        }
        return Promise.resolve({ data: invoice, status: 'success' })
    },

    uploadInvoiceDocument(invoiceId: string, document: InvoiceDocument): Promise<ApiResponse<InvoiceDocument>> {
        return Promise.resolve({ data: document, status: 'success' })
    },

    submitInvoice(invoiceId: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    quoteAdvance(request: AdvanceQuoteRequest): Promise<ApiResponse<{ financingModel: FinancingModel; repaymentParty: RepaymentParty; advanceAmount: number; feeAmount: number; settlementBufferAmount: number; expectedRepaymentAmount: number }>> {
        return Promise.resolve({
            data: {
                financingModel: 'InvoiceFactoring',
                repaymentParty: 'Client',
                advanceAmount: 14000,
                feeAmount: 280,
                settlementBufferAmount: 720,
                expectedRepaymentAmount: 15000,
            },
            status: 'success',
        })
    },

    createAdvanceRequest(request: AdvanceRequestPayload): Promise<ApiResponse<{ advanceId: string }>> {
        return Promise.resolve({ data: { advanceId: 'adv-demo' }, status: 'success' })
    },

    listAdvanceRequests(): Promise<ApiResponse<unknown[]>> {
        return Promise.resolve({ data: [], status: 'success' })
    },

    getAdvanceRequest(id: string): Promise<ApiResponse<unknown>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    simulateDisbursement(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    simulateClientPaymentDetected(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    simulateUserRepayment(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    simulateClientPaymentToHassil(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    simulateBufferRelease(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    getClientConfirmation(token: string): Promise<ApiResponse<ClientConfirmation>> {
        const confirmation: ClientConfirmation = {
            id: 'conf-demo',
            invoiceId: 'inv-demo',
            token,
            clientEmail: 'client@demo.io',
            status: 'Pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
        return Promise.resolve({ data: confirmation, status: 'success' })
    },

    confirmClientInvoice(token: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    disputeClientInvoice(token: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    listPendingAdminAdvanceRequests(): Promise<ApiResponse<unknown[]>> {
        return Promise.resolve({ data: [], status: 'success' })
    },

    getAdminAdvanceRequest(id: string): Promise<ApiResponse<unknown>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    adminApprove(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    adminReject(id: string, reason: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    adminRequestMoreInfo(id: string): Promise<ApiResponse<null>> {
        return Promise.resolve({ data: null, status: 'success' })
    },

    adminRefreshAiReview(id: string): Promise<ApiResponse<{ summary: string }>> {
        return Promise.resolve({ data: { summary: 'AI review refreshed.' }, status: 'success' })
    },
}
