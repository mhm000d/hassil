import type { Invoice } from '../types'
import { api } from './apiClient'

export const InvoiceService = {
    list: async (): Promise<Invoice[]> => {
        return await api.get<Invoice[]>('/invoices')
    },

    getById: async (id: string): Promise<Invoice> => {
        return await api.get<Invoice>(`/invoices/${id}`)
    },

    create: async (invoice: Invoice): Promise<Invoice> => {
        return await api.post<Invoice>('/invoices', invoice)
    }
}
