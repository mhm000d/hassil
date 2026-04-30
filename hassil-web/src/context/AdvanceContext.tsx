import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react'
import type { AdvanceRequest } from '../types'
import { AdvanceService } from '../services'
import { AuthContext } from './AuthContext'

interface AdvanceContextValue {
    advances: AdvanceRequest[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    get: (id: string) => Promise<AdvanceRequest | undefined>
    create: (advance: AdvanceRequest) => Promise<AdvanceRequest>
    update: (id: string, patch: Partial<AdvanceRequest>) => Promise<AdvanceRequest | undefined>
    getQuote: (invoiceId: string) => Promise<any>
    simulateDisbursement: (id: string) => Promise<AdvanceRequest | undefined>
    simulateClientPaymentDetected: (id: string) => Promise<AdvanceRequest | undefined>
    simulateUserRepayment: (id: string) => Promise<AdvanceRequest | undefined>
    simulateClientPaidHassil: (id: string) => Promise<AdvanceRequest | undefined>
    simulateBufferRelease: (id: string) => Promise<AdvanceRequest | undefined>
}

export const AdvanceContext = createContext<AdvanceContextValue>({
    advances: [],
    loading: true,
    error: null,
    refetch: async () => {},
    get: async () => undefined,
    create: async (a) => a,
    update: async () => undefined,
    getQuote: async () => ({}),
    simulateDisbursement: async () => undefined,
    simulateClientPaymentDetected: async () => undefined,
    simulateUserRepayment: async () => undefined,
    simulateClientPaidHassil: async () => undefined,
    simulateBufferRelease: async () => undefined,
})

export function AdvanceProvider({ children }: { children: ReactNode }) {
    const { user } = useContext(AuthContext)
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

    // Re-fetch whenever the logged-in user changes (login, logout, account switch)
    useEffect(() => {
        fetchAdvances()
    }, [fetchAdvances, user?.id])

    // Silently refetch when the tab regains focus — picks up admin decisions
    // made in another tab without requiring a manual page refresh.
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchAdvances()
        }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [fetchAdvances])

    // Pick up admin decisions made in the same tab via localStorage writes.
    // The 'storage' event only fires for cross-tab changes, so we use a
    // custom event dispatched by the mock API after every saveState() call.
    useEffect(() => {
        const onStateChange = () => fetchAdvances()
        window.addEventListener('hassil:state-changed', onStateChange)
        return () => window.removeEventListener('hassil:state-changed', onStateChange)
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

    const getQuote = async (invoiceId: string) => {
        return await AdvanceService.getQuote(invoiceId)
    }

    const simulateDisbursement = async (id: string) => {
        const res = await AdvanceService.simulateDisbursement(id)
        await fetchAdvances()
        return res
    }

    const simulateClientPaymentDetected = async (id: string) => {
        const res = await AdvanceService.simulateClientPaymentDetected(id)
        await fetchAdvances()
        return res
    }

    const simulateUserRepayment = async (id: string) => {
        const res = await AdvanceService.simulateUserRepayment(id)
        await fetchAdvances()
        return res
    }

    const simulateClientPaidHassil = async (id: string) => {
        const res = await AdvanceService.simulateClientPaidHassil(id)
        await fetchAdvances()
        return res
    }

    const simulateBufferRelease = async (id: string) => {
        const res = await AdvanceService.simulateBufferRelease(id)
        await fetchAdvances()
        return res
    }

    return (
        <AdvanceContext.Provider value={{ 
            advances, loading, error, refetch: fetchAdvances, get, create, update,
            getQuote, simulateDisbursement, simulateClientPaymentDetected,
            simulateUserRepayment, simulateClientPaidHassil, simulateBufferRelease
        }}>
            {children}
        </AdvanceContext.Provider>
    )
}
