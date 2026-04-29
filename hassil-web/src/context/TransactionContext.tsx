import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Transaction } from '../types'
import { TransactionService } from '../services'

interface TransactionContextValue {
    transactions: Transaction[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    create: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>
}

export const TransactionContext = createContext<TransactionContextValue>({
    transactions: [],
    loading: true,
    error: null,
    refetch: async () => {},
    create: async (tx: any) => tx as Transaction,
})

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true)
            const data = await TransactionService.list()
            setTransactions(data)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transactions')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const create = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        const res = await TransactionService.create(tx)
        await fetchTransactions()
        return res
    }

    return (
        <TransactionContext.Provider value={{ transactions, loading, error, refetch: fetchTransactions, create }}>
            {children}
        </TransactionContext.Provider>
    )
}
