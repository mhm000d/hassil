import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react'
import type { Transaction } from '../types'
import { TransactionService } from '../services'
import { AuthContext } from './AuthContext'

interface TransactionContextValue {
    transactions: Transaction[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export const TransactionContext = createContext<TransactionContextValue>({
    transactions: [],
    loading: true,
    error: null,
    refetch: async () => {},
})

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useContext(AuthContext)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTransactions = useCallback(async () => {
        if (!isInitialized) return
        if (!user) {
            setTransactions([])
            setLoading(false)
            setError(null)
            return
        }

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
    }, [isInitialized, user])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    return (
        <TransactionContext.Provider value={{ transactions, loading, error, refetch: fetchTransactions }}>
            {children}
        </TransactionContext.Provider>
    )
}
