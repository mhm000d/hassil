import { api } from './apiClient'
import type { AdminReview, AdvanceRequest, Invoice, AiReviewSnapshot } from '../types'

export const AdminService = {
    getReviewData: async () => {
        return await Promise.all([
            api.get<AdvanceRequest[]>('/admin/advances'),
            api.get<Invoice[]>('/admin/invoices'),
            api.get<AiReviewSnapshot[]>('/admin/ai-snapshots')
        ])
    },

    listInvoices: async () => {
        return await api.get<Invoice[]>('/admin/invoices')
    },

    listAdvances: async () => {
        return await api.get<AdvanceRequest[]>('/admin/advances')
    },

    listAiSnapshots: async () => {
        return await api.get<AiReviewSnapshot[]>('/admin/ai-snapshots')
    },

    updateAdvance: async (id: string, patch: Partial<AdvanceRequest>) => {
        return await api.patch<AdvanceRequest>(`/advances/${id}`, patch)
    },

    updateInvoice: async (id: string, patch: Partial<Invoice>) => {
        return await api.patch<Invoice>(`/invoices/${id}`, patch)
    },

    addReview: async (review: Omit<AdminReview, 'id' | 'createdAt'>) => {
        return await api.post<AdminReview>('/admin-reviews', review)
    },
    generateAiReview: async (advanceId: string) => {
        return await api.post<AiReviewSnapshot>(`/admin/advance-requests/${advanceId}/ai-review`)
    }
}
