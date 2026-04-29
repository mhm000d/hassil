import type { AdvanceRequest } from '../types'
import { api } from './apiClient'

export const AdvanceService = {
    list: async () => {
        return await api.get<AdvanceRequest[]>('/advances')
    },
    get: async (id: string) => {
        return await api.get<AdvanceRequest>(`/advances/${id}`)
    },
    create: async (advance: AdvanceRequest) => {
        return await api.post<AdvanceRequest>('/advances', advance)
    },
    update: async (id: string, patch: Partial<AdvanceRequest>) => {
        return await api.patch<AdvanceRequest>(`/advances/${id}`, patch)
    }
}
