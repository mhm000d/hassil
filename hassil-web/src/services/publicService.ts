import { api } from './apiClient'
import type { Invoice, ConfirmationStatus } from '../types'

export const PublicService = {
    getClientConfirmation: async (token: string) => {
        return await api.get<{ invoice: Invoice; confirmation: any }>(`/public/confirm/${token}`, { authRequired: false })
    },

    updateClientConfirmation: async (token: string, payload: { status: ConfirmationStatus, clientNote: string, respondedAt: string }) => {
        return await api.post(`/public/confirm/${token}`, payload, { authRequired: false })
    }
}
