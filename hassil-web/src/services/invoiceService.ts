import { api } from './apiClient'
import type { Invoice } from '../types'

export const InvoiceService = {
    list: async () => {
        return await api.get<Invoice[]>('/invoices')
    },
    get: async (id: string) => {
        return await api.get<Invoice>(`/invoices/${id}`)
    },
    create: async (invoice: Invoice) => {
        return await api.post<Invoice>('/invoices', invoice)
    },
    update: async (id: string, patch: Partial<Invoice>) => {
        return await api.patch<Invoice>(`/invoices/${id}`, patch)
    }
}
