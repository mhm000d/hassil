import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react'
import type { Transaction, TrustScoreEvent } from '../types'
import { TransactionService } from '../services'
import { AuthContext } from './AuthContext'

interface TransactionContextValue {
    transactions: Transaction[]
    trustScoreEvents: TrustScoreEvent[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    create: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>
}

export const TransactionContext = createContext<TransactionContextValue>({
    transactions: [],
    trustScoreEvents: [],
    loading: true,
    error: null,
    refetch: async () => {},
    create: async (tx: any) => tx as Transaction,
})

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { user } = useContext(AuthContext)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [trustScoreEvents, setTrustScoreEvents] = useState<TrustScoreEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true)
            const [txData, trustData] = await Promise.all([
                TransactionService.list(),
                TransactionService.listTrustScoreEvents(),
            ])
            setTransactions(txData)
            setTrustScoreEvents(trustData)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transactions')
        } finally {
            setLoading(false)
        }
    }, [])

    // Re-fetch whenever the logged-in user changes (login, logout, account switch)
    useEffect(() => {
        fetchAll()
    }, [fetchAll, user?.id])

    const create = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
        const res = await TransactionService.create(tx)
        await fetchAll()
        return res
    }

    return (
        <TransactionContext.Provider value={{ transactions, trustScoreEvents, loading, error, refetch: fetchAll, create }}>
            {children}
        </TransactionContext.Provider>
    )
}
