import { api } from './apiClient'
import {
    mapAdvanceResponse,
    mapAdvanceSummary,
    type ApiAdvanceRequestResponse,
    type ApiAdvanceRequestSummaryResponse,
} from './advanceService'
import type {
    AdminDecision,
    AdminReview,
    AdvanceRequest,
    AiRecommendedAction,
    AiReviewSnapshot,
    AiRiskLevel,
    Invoice,
    ReceivableSource,
} from '../types'

export interface ReviewChecklistItem {
    label: string
    passed: boolean
    detail?: string
}

export interface AdminAdvanceRequestDetail {
    advanceRequest: AdvanceRequest
    invoice: Invoice
    verificationChecklist: ReviewChecklistItem[]
    latestAiReview?: AiReviewSnapshot
    adminReviews: AdminReview[]
}

interface ApiClient {
    id: string
    name: string
    email: string
    country?: string
}

interface ApiInvoiceSummaryResponse {
    id: string
    userId: string
    invoiceNumber: string
    client: ApiClient
    receivableSource: string
    amount: number
    currency: string
    dueDate: string
    status: Invoice['status']
    documentCount: number
    advanceRequestId?: string | null
    createdAt: string
}

interface ApiAdminAdvanceRequestResponse extends Omit<ApiAdvanceRequestResponse, 'invoice'> {
    invoice: ApiInvoiceSummaryResponse
}

interface ApiReviewChecklistItemResponse {
    label: string
    passed: boolean
    detail?: string
}

interface ApiAiReviewSnapshotResponse {
    id: string
    riskLevel: string
    recommendedAction: string
    summary: string
    riskFlags: string[]
    modelName: string
    createdAt: string
}

interface ApiAdminReviewResponse {
    id: string
    reviewerUserId: string
    decision: string
    notes?: string
    createdAt: string
}

interface ApiAdminAdvanceRequestDetailResponse {
    advanceRequest: ApiAdminAdvanceRequestResponse
    verificationChecklist: ApiReviewChecklistItemResponse[]
    latestAiReview?: ApiAiReviewSnapshotResponse | null
    adminReviews: ApiAdminReviewResponse[]
}

function mapInvoiceSummary(response: ApiInvoiceSummaryResponse): Invoice {
    return {
        id: response.id,
        userId: response.userId,
        clientId: response.client.id,
        client: response.client,
        invoiceNumber: response.invoiceNumber,
        receivableSource: response.receivableSource as ReceivableSource,
        amount: response.amount,
        currency: response.currency,
        issueDate: response.createdAt.slice(0, 10),
        dueDate: response.dueDate,
        status: response.status,
        fingerprint: '',
        createdAt: response.createdAt,
        documents: [],
        documentCount: response.documentCount,
        advanceRequestId: response.advanceRequestId ?? undefined,
    }
}

function mapAiReview(
    response: ApiAiReviewSnapshotResponse | null | undefined,
    advanceRequestId: string,
): AiReviewSnapshot | undefined {
    if (!response) return undefined

    return {
        id: response.id,
        advanceRequestId,
        riskLevel: response.riskLevel as AiRiskLevel,
        recommendedAction: response.recommendedAction as AiRecommendedAction,
        summary: response.summary,
        riskFlags: response.riskFlags,
        createdAt: response.createdAt,
    }
}

function mapAdminReview(response: ApiAdminReviewResponse, advanceRequestId: string): AdminReview {
    return {
        id: response.id,
        advanceRequestId,
        reviewerUserId: response.reviewerUserId,
        decision: response.decision as AdminDecision,
        notes: response.notes,
        createdAt: response.createdAt,
    }
}

function mapDetail(response: ApiAdminAdvanceRequestDetailResponse): AdminAdvanceRequestDetail {
    const advanceRequest = mapAdvanceResponse(response.advanceRequest)

    return {
        advanceRequest,
        invoice: mapInvoiceSummary(response.advanceRequest.invoice),
        verificationChecklist: response.verificationChecklist.map((item) => ({
            label: item.label,
            passed: item.passed,
            detail: item.detail,
        })),
        latestAiReview: mapAiReview(response.latestAiReview, response.advanceRequest.id),
        adminReviews: response.adminReviews.map((review) => mapAdminReview(review, response.advanceRequest.id)),
    }
}

const adminAdvancePath = (id: string) => `/admin/advance-requests/${id}`

export const AdminService = {
    listPending: async () => {
        const response = await api.get<ApiAdvanceRequestSummaryResponse[]>('/admin/advance-requests/pending')
        return response.map(mapAdvanceSummary)
    },

    getDetail: async (id: string) => {
        const response = await api.get<ApiAdminAdvanceRequestDetailResponse>(adminAdvancePath(id))
        return mapDetail(response)
    },

    approve: async (id: string, notes?: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/approve`,
            { notes },
        )
        return mapDetail(response)
    },

    sendClientConfirmation: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/send-client-confirmation`,
        )
        return mapDetail(response)
    },

    approveAndDisburse: async (id: string, notes?: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/approve-and-disburse`,
            { notes },
        )
        return mapDetail(response)
    },

    reject: async (id: string, reason: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/reject`,
            { reason },
        )
        return mapDetail(response)
    },

    requestMoreInfo: async (id: string, notes?: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/request-more-info`,
            { notes },
        )
        return mapDetail(response)
    },

    generateAiReview: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/ai-review`,
        )
        return mapDetail(response)
    },

    simulateDisbursement: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/simulate-disbursement`,
        )
        return mapDetail(response)
    },

    simulateClientPaymentDetected: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/simulate-client-payment-detected`,
        )
        return mapDetail(response)
    },

    simulateUserRepayment: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/simulate-user-repayment`,
        )
        return mapDetail(response)
    },

    simulateClientPaymentToHassil: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/simulate-client-payment-to-hassil`,
        )
        return mapDetail(response)
    },

    simulateBufferRelease: async (id: string) => {
        const response = await api.post<ApiAdminAdvanceRequestDetailResponse>(
            `${adminAdvancePath(id)}/simulate-buffer-release`,
        )
        return mapDetail(response)
    },
}
