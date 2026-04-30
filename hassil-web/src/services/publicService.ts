import { api } from './apiClient'
import type { ClientConfirmation, ConfirmationStatus, Invoice, ReceivableSource } from '../types'

export interface ClientConfirmationDetails {
    invoice: Invoice
    confirmation: ClientConfirmation
    advanceRequest?: {
        id: string
        invoiceId: string
        invoiceNumber: string
        financingModel: string
        advanceAmount: number
        feeAmount: number
        expectedRepaymentAmount: number
        reviewScore: number
        status: string
        createdAt: string
    }
}

interface ApiClient {
    id: string
    name: string
    email: string
    country?: string
}

interface ApiInvoiceSummaryResponse {
    id: string
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

interface ApiAdvanceRequestSummaryResponse {
    id: string
    invoiceId: string
    invoiceNumber: string
    financingModel: string
    advanceAmount: number
    feeAmount: number
    expectedRepaymentAmount: number
    reviewScore: number
    status: string
    createdAt: string
}

interface ApiClientConfirmationResponse {
    id: string
    token: string
    clientEmail: string
    status: ConfirmationStatus
    clientNote?: string
    respondedAt?: string
    expiresAt: string
    invoice: ApiInvoiceSummaryResponse
    advanceRequest?: ApiAdvanceRequestSummaryResponse | null
}

function mapInvoiceSummary(response: ApiInvoiceSummaryResponse): Invoice {
    return {
        id: response.id,
        userId: '',
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

function mapResponse(response: ApiClientConfirmationResponse): ClientConfirmationDetails {
    const invoice = mapInvoiceSummary(response.invoice)

    return {
        invoice: {
            ...invoice,
            clientConfirmation: {
                id: response.id,
                invoiceId: invoice.id,
                token: response.token,
                clientEmail: response.clientEmail,
                status: response.status,
                clientNote: response.clientNote,
                respondedAt: response.respondedAt,
                expiresAt: response.expiresAt,
            },
        },
        confirmation: {
            id: response.id,
            invoiceId: invoice.id,
            token: response.token,
            clientEmail: response.clientEmail,
            status: response.status,
            clientNote: response.clientNote,
            respondedAt: response.respondedAt,
            expiresAt: response.expiresAt,
        },
        advanceRequest: response.advanceRequest ?? undefined,
    }
}

function confirmationPath(token: string) {
    return `/client-confirmations/${encodeURIComponent(token)}`
}

export const PublicService = {
    getClientConfirmation: async (token: string) => {
        const response = await api.get<ApiClientConfirmationResponse>(confirmationPath(token), { authRequired: false })
        return mapResponse(response)
    },

    confirmClientConfirmation: async (token: string, note: string) => {
        const response = await api.post<ApiClientConfirmationResponse>(
            `${confirmationPath(token)}/confirm`,
            { note },
            { authRequired: false },
        )
        return mapResponse(response)
    },

    disputeClientConfirmation: async (token: string, note: string) => {
        const response = await api.post<ApiClientConfirmationResponse>(
            `${confirmationPath(token)}/dispute`,
            { note },
            { authRequired: false },
        )
        return mapResponse(response)
    },
}
