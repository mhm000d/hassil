import { createContext, useState, useEffect, useCallback, useContext, useMemo, type ReactNode } from 'react'
import type { AdvanceQuote, AdvanceRequest } from '../types'
import {
    AdvanceService,
    type AdvanceQuoteRequestPayload,
    type CreateAdvanceRequestPayload,
} from '../services'
import { AuthContext } from './AuthContext'

interface AdvanceContextValue {
    advances: AdvanceRequest[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    quote: (request: AdvanceQuoteRequestPayload) => Promise<AdvanceQuote>
    get: (id: string) => Promise<AdvanceRequest | undefined>
    create: (request: CreateAdvanceRequestPayload) => Promise<AdvanceRequest>
    update: (id: string, patch: Partial<AdvanceRequest>) => Promise<AdvanceRequest | undefined>
    simulateDisbursement: (id: string) => Promise<AdvanceRequest>
    simulateClientPaymentDetected: (id: string) => Promise<AdvanceRequest>
    simulateUserRepayment: (id: string) => Promise<AdvanceRequest>
    simulateClientPaymentToHassil: (id: string) => Promise<AdvanceRequest>
    simulateBufferRelease: (id: string) => Promise<AdvanceRequest>
}

export const AdvanceContext = createContext<AdvanceContextValue>({
    advances: [],
    loading: true,
    error: null,
    refetch: async () => {},
    quote: async () => {
        throw new Error('Advance provider is not ready')
    },
    get: async () => undefined,
    create: async () => {
        throw new Error('Advance provider is not ready')
    },
    update: async () => undefined,
    simulateDisbursement: async () => {
        throw new Error('Advance provider is not ready')
    },
    simulateClientPaymentDetected: async () => {
        throw new Error('Advance provider is not ready')
    },
    simulateUserRepayment: async () => {
        throw new Error('Advance provider is not ready')
    },
    simulateClientPaymentToHassil: async () => {
        throw new Error('Advance provider is not ready')
    },
    simulateBufferRelease: async () => {
        throw new Error('Advance provider is not ready')
    },
})

export function AdvanceProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useContext(AuthContext)
    const [advances, setAdvances] = useState<AdvanceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAdvances = useCallback(async () => {
        if (!isInitialized) return
        if (!user) {
            setAdvances([])
            setLoading(false)
            setError(null)
            return
        }

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
    }, [isInitialized, user])

    useEffect(() => {
        fetchAdvances()
    }, [fetchAdvances])

    const upsertAdvance = useCallback((advance: AdvanceRequest) => {
        setAdvances((current) => {
            const exists = current.some((item) => item.id === advance.id)
            return exists
                ? current.map((item) => item.id === advance.id ? advance : item)
                : [advance, ...current]
        })
    }, [])

    const quote = useCallback(async (request: AdvanceQuoteRequestPayload) => {
        return await AdvanceService.quote(request)
    }, [])

    const get = useCallback(async (id: string) => {
        const advance = await AdvanceService.get(id)
        upsertAdvance(advance)
        return advance
    }, [upsertAdvance])

    const create = useCallback(async (request: CreateAdvanceRequestPayload) => {
        const res = await AdvanceService.create(request)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const update = useCallback(async (id: string, patch: Partial<AdvanceRequest>) => {
        let updated: AdvanceRequest | undefined
        setAdvances((current) => current.map((advance) => {
            if (advance.id !== id) return advance
            updated = { ...advance, ...patch }
            return updated
        }))
        return updated
    }, [])

    const simulateDisbursement = useCallback(async (id: string) => {
        const res = await AdvanceService.simulateDisbursement(id)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const simulateClientPaymentDetected = useCallback(async (id: string) => {
        const res = await AdvanceService.simulateClientPaymentDetected(id)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const simulateUserRepayment = useCallback(async (id: string) => {
        const res = await AdvanceService.simulateUserRepayment(id)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const simulateClientPaymentToHassil = useCallback(async (id: string) => {
        const res = await AdvanceService.simulateClientPaymentToHassil(id)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const simulateBufferRelease = useCallback(async (id: string) => {
        const res = await AdvanceService.simulateBufferRelease(id)
        upsertAdvance(res)
        return res
    }, [upsertAdvance])

    const value = useMemo<AdvanceContextValue>(() => ({
        advances,
        loading,
        error,
        refetch: fetchAdvances,
        quote,
        get,
        create,
        update,
        simulateDisbursement,
        simulateClientPaymentDetected,
        simulateUserRepayment,
        simulateClientPaymentToHassil,
        simulateBufferRelease,
    }), [
        advances,
        loading,
        error,
        fetchAdvances,
        quote,
        get,
        create,
        update,
        simulateDisbursement,
        simulateClientPaymentDetected,
        simulateUserRepayment,
        simulateClientPaymentToHassil,
        simulateBufferRelease,
    ])

    return (
        <AdvanceContext.Provider value={value}>
            {children}
        </AdvanceContext.Provider>
    )
}
