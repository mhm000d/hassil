import type { AdvanceRequest } from '../types'
import { api } from './apiClient'

export const AdvanceService = {
    list: async (): Promise<AdvanceRequest[]> => {
        return await api.get<AdvanceRequest[]>('/advances')
    },

    getById: async (id: string): Promise<AdvanceRequest> => {
        return await api.get<AdvanceRequest>(`/advances/${id}`)
    },

    create: async (advance: AdvanceRequest): Promise<AdvanceRequest> => {
        return await api.post<AdvanceRequest>('/advances', advance)
    }
}
