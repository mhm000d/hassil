import { api } from './apiClient'
import type { Invoice, InvoiceDocument, ReceivableSource } from '../types'

export interface CreateInvoicePayload {
    clientName: string
    clientEmail: string
    clientCountry?: string
    invoiceNumber: string
    receivableSource: ReceivableSource
    amount: number
    currency: string
    issueDate: string
    dueDate: string
    description?: string
    paymentTerms?: string
}

export interface AddInvoiceDocumentPayload {
    fileName: string
    fileUrl?: string
    documentType: string
}

interface ApiClient {
    id: string
    name: string
    email: string
    country?: string
}

interface ApiInvoiceDocument {
    id: string
    fileName: string
    fileUrl?: string
    documentType: string
    uploadedAt: string
}

interface ApiInvoiceResponse {
    id: string
    userId: string
    client: ApiClient
    invoiceNumber: string
    receivableSource: ReceivableSource
    amount: number
    currency: string
    issueDate: string
    dueDate: string
    description?: string
    paymentTerms?: string
    status: Invoice['status']
    invoiceFingerprint: string
    documents: ApiInvoiceDocument[]
    advanceRequestId?: string | null
    createdAt: string
    updatedAt: string
}

interface ApiInvoiceSummaryResponse {
    id: string
    invoiceNumber: string
    client: ApiClient
    receivableSource: ReceivableSource
    amount: number
    currency: string
    dueDate: string
    status: Invoice['status']
    documentCount: number
    advanceRequestId?: string | null
    createdAt: string
}

function mapDocument(document: ApiInvoiceDocument, invoiceId: string): InvoiceDocument {
    return {
        id: document.id,
        invoiceId,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        documentType: document.documentType,
        uploadedAt: document.uploadedAt,
    }
}

function mapInvoice(response: ApiInvoiceResponse): Invoice {
    return {
        id: response.id,
        userId: response.userId,
        clientId: response.client.id,
        client: response.client,
        invoiceNumber: response.invoiceNumber,
        receivableSource: response.receivableSource,
        amount: response.amount,
        currency: response.currency,
        issueDate: response.issueDate,
        dueDate: response.dueDate,
        description: response.description,
        paymentTerms: response.paymentTerms,
        status: response.status,
        fingerprint: response.invoiceFingerprint,
        invoiceFingerprint: response.invoiceFingerprint,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        documents: response.documents.map((document) => mapDocument(document, response.id)),
        documentCount: response.documents.length,
        advanceRequestId: response.advanceRequestId ?? undefined,
    }
}

function mapInvoiceSummary(response: ApiInvoiceSummaryResponse): Invoice {
    return {
        id: response.id,
        userId: '',
        clientId: response.client.id,
        client: response.client,
        invoiceNumber: response.invoiceNumber,
        receivableSource: response.receivableSource,
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

export const InvoiceService = {
    list: async () => {
        const response = await api.get<ApiInvoiceSummaryResponse[]>('/invoices')
        return response.map(mapInvoiceSummary)
    },

    get: async (id: string) => {
        const response = await api.get<ApiInvoiceResponse>(`/invoices/${id}`)
        return mapInvoice(response)
    },

    create: async (invoice: CreateInvoicePayload) => {
        const response = await api.post<ApiInvoiceResponse>('/invoices', invoice)
        return mapInvoice(response)
    },

    addDocument: async (id: string, document: AddInvoiceDocumentPayload) => {
        const response = await api.post<ApiInvoiceDocument>(`/invoices/${id}/documents`, document)
        return mapDocument(response, id)
    },

    submit: async (id: string) => {
        const response = await api.post<ApiInvoiceResponse>(`/invoices/${id}/submit`)
        return mapInvoice(response)
    },
}
