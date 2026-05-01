import type {
    AdvanceQuote,
    AdvanceRequest,
    AdvanceStatus,
    ConfirmationStatus,
    FeeCollectionTiming,
    FinancingModel,
    PaymentDestination,
    RepaymentParty,
    Transaction,
    TransactionDirection,
    TransactionType,
} from '../types'
import { api } from './apiClient'

export interface AdvanceQuoteRequestPayload {
    invoiceId: string
    requestedPercent?: number
}

export interface CreateAdvanceRequestPayload {
    invoiceId: string
    requestedPercent?: number
    termsAccepted: boolean
    termsVersion?: string
}

interface ApiAdvanceQuoteResponse {
    invoiceId: string
    financingModel: string
    repaymentParty: string
    paymentDestination: string
    feeCollectionTiming: string
    clientNotificationRequired: boolean
    clientPaymentRedirectRequired: boolean
    requestedPercent: number
    maxAdvancePercent: number
    maxEligibleInvoiceAmount: number
    advanceAmount: number
    feeRate: number
    feeAmount: number
    settlementBufferAmount: number
    expectedRepaymentAmount: number
    isEligible: boolean
    eligibilityMessages: string[]
}

export interface ApiAdvanceRequestSummaryResponse {
    id: string
    invoiceId: string
    invoiceNumber: string
    userId: string
    financingModel: string
    advanceAmount: number
    feeAmount: number
    expectedRepaymentAmount: number
    reviewScore: number
    status: string
    clientConfirmationStatus?: string | null
    createdAt: string
    updatedAt: string
}

export interface ApiAdvanceInvoiceSummaryResponse {
    id: string
    userId: string
    invoiceNumber: string
}

export interface ApiAdvanceTransactionResponse {
    id: string
    type: string
    direction: string
    amount: number
    description?: string
    createdAt: string
}

export interface ApiAdvanceRequestResponse {
    id: string
    invoice: ApiAdvanceInvoiceSummaryResponse
    financingModel: string
    repaymentParty: string
    paymentDestination: string
    feeCollectionTiming: string
    clientNotificationRequired: boolean
    clientPaymentRedirectRequired: boolean
    requestedPercent: number
    advanceAmount: number
    feeRate: number
    feeAmount: number
    settlementBufferAmount: number
    expectedRepaymentAmount: number
    reviewScore: number
    approvalMode?: 'Auto' | 'Manual'
    status: string
    clientConfirmationToken?: string
    clientConfirmationStatus?: string
    rejectionReason?: string
    reviewedAt?: string
    termsAcceptedAt?: string
    termsVersion: string
    transactions: ApiAdvanceTransactionResponse[]
    createdAt: string
    updatedAt: string
}

function deriveRepaymentParty(model: FinancingModel): RepaymentParty {
    return model === 'InvoiceFactoring' ? 'Client' : 'User'
}

function derivePaymentDestination(model: FinancingModel): PaymentDestination {
    return model === 'InvoiceFactoring' ? 'HassilCollectionAccount' : 'UserBankAccount'
}

function deriveFeeCollectionTiming(model: FinancingModel): FeeCollectionTiming {
    return model === 'InvoiceFactoring' ? 'FromSettlementBuffer' : 'AtUserRepayment'
}

function mapQuote(response: ApiAdvanceQuoteResponse): AdvanceQuote {
    return {
        invoiceId: response.invoiceId,
        financingModel: response.financingModel as FinancingModel,
        repaymentParty: response.repaymentParty as RepaymentParty,
        paymentDestination: response.paymentDestination as PaymentDestination,
        feeCollectionTiming: response.feeCollectionTiming as FeeCollectionTiming,
        clientNotificationRequired: response.clientNotificationRequired,
        clientPaymentRedirectRequired: response.clientPaymentRedirectRequired,
        requestedPercent: response.requestedPercent,
        maxAdvancePercent: response.maxAdvancePercent,
        maxEligibleInvoiceAmount: response.maxEligibleInvoiceAmount,
        advanceAmount: response.advanceAmount,
        feeRate: response.feeRate,
        feeAmount: response.feeAmount,
        settlementBufferAmount: response.settlementBufferAmount,
        expectedRepaymentAmount: response.expectedRepaymentAmount,
        isEligible: response.isEligible,
        eligibilityMessages: response.eligibilityMessages,
    }
}

export function mapAdvanceSummary(response: ApiAdvanceRequestSummaryResponse): AdvanceRequest {
    const financingModel = response.financingModel as FinancingModel

    return {
        id: response.id,
        invoiceId: response.invoiceId,
        invoiceNumber: response.invoiceNumber,
        userId: response.userId,
        financingModel,
        repaymentParty: deriveRepaymentParty(financingModel),
        paymentDestination: derivePaymentDestination(financingModel),
        feeCollectionTiming: deriveFeeCollectionTiming(financingModel),
        clientNotificationRequired: financingModel === 'InvoiceFactoring',
        clientPaymentRedirectRequired: financingModel === 'InvoiceFactoring',
        requestedPercent: 0,
        advanceAmount: response.advanceAmount,
        feeRate: 0,
        feeAmount: response.feeAmount,
        settlementBufferAmount: 0,
        expectedRepaymentAmount: response.expectedRepaymentAmount,
        reviewScore: response.reviewScore,
        status: response.status as AdvanceStatus,
        clientConfirmationStatus: response.clientConfirmationStatus
            ? response.clientConfirmationStatus as ConfirmationStatus
            : undefined,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
    }
}

function mapTransaction(
    response: ApiAdvanceTransactionResponse,
    advanceRequestId: string,
    invoiceId: string,
    userId: string,
): Transaction {
    return {
        id: response.id,
        userId,
        invoiceId,
        advanceRequestId,
        type: response.type as TransactionType,
        direction: response.direction as TransactionDirection,
        amount: response.amount,
        description: response.description,
        createdAt: response.createdAt,
    }
}

export function mapAdvanceResponse(response: ApiAdvanceRequestResponse): AdvanceRequest {
    const invoiceId = response.invoice.id
    const userId = response.invoice.userId

    return {
        id: response.id,
        invoiceId,
        invoiceNumber: response.invoice.invoiceNumber,
        userId,
        financingModel: response.financingModel as FinancingModel,
        repaymentParty: response.repaymentParty as RepaymentParty,
        paymentDestination: response.paymentDestination as PaymentDestination,
        feeCollectionTiming: response.feeCollectionTiming as FeeCollectionTiming,
        clientNotificationRequired: response.clientNotificationRequired,
        clientPaymentRedirectRequired: response.clientPaymentRedirectRequired,
        requestedPercent: response.requestedPercent,
        advanceAmount: response.advanceAmount,
        feeRate: response.feeRate,
        feeAmount: response.feeAmount,
        settlementBufferAmount: response.settlementBufferAmount,
        expectedRepaymentAmount: response.expectedRepaymentAmount,
        reviewScore: response.reviewScore,
        approvalMode: response.approvalMode,
        status: response.status as AdvanceStatus,
        clientConfirmationToken: response.clientConfirmationToken,
        clientConfirmationStatus: response.clientConfirmationStatus as ConfirmationStatus | undefined,
        rejectionReason: response.rejectionReason,
        reviewedAt: response.reviewedAt,
        termsAcceptedAt: response.termsAcceptedAt,
        termsVersion: response.termsVersion,
        transactions: response.transactions.map((transaction) => mapTransaction(transaction, response.id, invoiceId, userId)),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
    }
}

export const AdvanceService = {
    quote: async (request: AdvanceQuoteRequestPayload) => {
        const response = await api.post<ApiAdvanceQuoteResponse>('/advance-requests/quote', request)
        return mapQuote(response)
    },

    list: async () => {
        const response = await api.get<ApiAdvanceRequestSummaryResponse[]>('/advance-requests')
        return response.map(mapAdvanceSummary)
    },

    get: async (id: string) => {
        const response = await api.get<ApiAdvanceRequestResponse>(`/advance-requests/${id}`)
        return mapAdvanceResponse(response)
    },

    create: async (request: CreateAdvanceRequestPayload) => {
        const response = await api.post<ApiAdvanceRequestResponse>('/advance-requests', request)
        return mapAdvanceResponse(response)
    },
}
