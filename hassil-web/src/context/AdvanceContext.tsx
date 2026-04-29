import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdvanceRequest } from '../types'
import { AdvanceService } from '../services'

interface AdvanceContextValue {
    advances: AdvanceRequest[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    get: (id: string) => Promise<AdvanceRequest | undefined>
    create: (advance: AdvanceRequest) => Promise<AdvanceRequest>
    update: (id: string, patch: Partial<AdvanceRequest>) => Promise<AdvanceRequest | undefined>
}

export const AdvanceContext = createContext<AdvanceContextValue>({
    advances: [],
    loading: true,
    error: null,
    refetch: async () => {},
    get: async () => undefined,
    create: async (a) => a,
    update: async () => undefined,
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

    const get = async (id: string) => {
        return await AdvanceService.get(id)
    }

    const create = async (advance: AdvanceRequest) => {
        const res = await AdvanceService.create(advance)
        await fetchAdvances()
        return res
    }

    const update = async (id: string, patch: Partial<AdvanceRequest>) => {
        const res = await AdvanceService.update(id, patch)
        await fetchAdvances()
        return res
    }

    return (
        <AdvanceContext.Provider value={{ advances, loading, error, refetch: fetchAdvances, get, create, update }}>
            {children}
        </AdvanceContext.Provider>
    )
}
