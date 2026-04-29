import type { Transaction } from '../types'
import { api } from './apiClient'

export const TransactionService = {
    list: async (): Promise<Transaction[]> => {
        return await api.get<Transaction[]>('/transactions')
    }
}
