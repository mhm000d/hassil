import { api } from './apiClient'
import type { Transaction, TransactionDirection, TransactionType } from '../types'

export interface ApiTransactionResponse {
    id: string
    invoiceId?: string
    invoiceNumber?: string
    advanceRequestId?: string
    type: string
    direction: string
    amount: number
    description?: string
    createdAt: string
}

export function mapTransaction(response: ApiTransactionResponse): Transaction {
    return {
        id: response.id,
        userId: '',
        invoiceId: response.invoiceId,
        invoiceNumber: response.invoiceNumber,
        advanceRequestId: response.advanceRequestId,
        type: response.type as TransactionType,
        direction: response.direction as TransactionDirection,
        amount: response.amount,
        description: response.description,
        createdAt: response.createdAt,
    }
}

export const TransactionService = {
    list: async (limit = 100) => {
        const response = await api.get<ApiTransactionResponse[]>('/transactions', {
            params: { limit },
        })
        return response.map(mapTransaction)
    },
}
