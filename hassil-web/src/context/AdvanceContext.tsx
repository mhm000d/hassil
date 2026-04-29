import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdvanceRequest } from '../types'
import { AdvanceService } from '../services'

interface AdvanceContextValue {
    advances: AdvanceRequest[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export const AdvanceContext = createContext<AdvanceContextValue>({
    advances: [],
    loading: true,
    error: null,
    refetch: async () => {}
})

export function AdvanceProvider({ children }: { children: ReactNode }) {
    const [advances, setAdvances] = useState<AdvanceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAdvances = useCallback(async () => {
        try {
            setLoading(true)
            const data = await AdvanceService.list()
            setAdvances(data)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch advances')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAdvances()
    }, [fetchAdvances])

    return (
        <AdvanceContext.Provider value={{ advances, loading, error, refetch: fetchAdvances }}>
            {children}
        </AdvanceContext.Provider>
    )
}
