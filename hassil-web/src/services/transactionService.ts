import { api } from './apiClient'
import type { Transaction, TrustScoreEvent } from '../types'

export const TransactionService = {
    list: async () => {
        return await api.get<Transaction[]>('/transactions')
    },
    create: async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        return await api.post<Transaction>('/transactions', tx)
    },
    listTrustScoreEvents: async () => {
        return await api.get<TrustScoreEvent[]>('/trust-score-events')
    },
}
