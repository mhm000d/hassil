import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdvanceRequest, Invoice, AiReviewSnapshot, AdminReview } from '../types'
import { AdminService } from '../services/adminService'
import { api } from '../services/apiClient'

interface AdminContextValue {
    advances: AdvanceRequest[]
    invoices: Invoice[]
    aiSnapshots: AiReviewSnapshot[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getAiSnapshot: (advanceId: string) => Promise<AiReviewSnapshot | undefined>
    updateAdvance: (id: string, patch: Partial<AdvanceRequest>) => Promise<AdvanceRequest | undefined>
    updateInvoice: (id: string, patch: Partial<Invoice>) => Promise<Invoice | undefined>
    addReview: (review: Omit<AdminReview, 'id' | 'createdAt'>) => Promise<AdminReview>
    generateAiReview: (advanceId: string) => Promise<AiReviewSnapshot>
}

export const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
    const [advances, setAdvances] = useState<AdvanceRequest[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [aiSnapshots, setAiSnapshots] = useState<AiReviewSnapshot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true)
            const [advs, invs, aiSnaps] = await AdminService.getReviewData()
            setAdvances(advs)
            setInvoices(invs)
            setAiSnapshots(aiSnaps)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch admin data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const getAiSnapshot = async (advanceId: string) => {
        return await api.get<AiReviewSnapshot>(`/ai-snapshots/${advanceId}`)
    }

    const updateAdvance = async (id: string, patch: Partial<AdvanceRequest>) => {
        const res = await AdminService.updateAdvance(id, patch)
        await fetchAll()
        return res
    }

    const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
        const res = await AdminService.updateInvoice(id, patch)
        await fetchAll()
        return res
    }

    const addReview = async (review: Omit<AdminReview, 'id' | 'createdAt'>) => {
        const res = await AdminService.addReview(review)
        await fetchAll()
        return res
    }

    const generateAiReview = async (advanceId: string) => {
        const res = await AdminService.generateAiReview(advanceId)
        await fetchAll()
        return res
    }

    return (
        <AdminContext.Provider value={{ 
            advances, 
            invoices, 
            aiSnapshots, 
            loading, 
            error, 
            refetch: fetchAll,
            getAiSnapshot,
            updateAdvance,
            updateInvoice,
            addReview,
            generateAiReview
        }}>
            {children}
        </AdminContext.Provider>
    )
}
