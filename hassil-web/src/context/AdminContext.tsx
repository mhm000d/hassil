import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AdvanceRequest, Invoice, AiReviewSnapshot, AdminReview, User } from '../types'
import { AdminService } from '../services/adminService'
import { api } from '../services/apiClient'

interface AdminContextValue {
    advances: AdvanceRequest[]
    invoices: Invoice[]
    aiSnapshots: AiReviewSnapshot[]
    users: User[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getAiSnapshot: (advanceId: string) => Promise<AiReviewSnapshot | undefined>
    decide: (advanceId: string, decision: AdminReview['decision'], reviewerUserId: string, notes?: string) => Promise<void>
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
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true)
            const [advs, invs, aiSnaps, usrs] = await AdminService.getReviewData()
            setAdvances(advs)
            setInvoices(invs)
            setAiSnapshots(aiSnaps)
            setUsers(usrs)
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

    const decide = async (advanceId: string, decision: AdminReview['decision'], reviewerUserId: string, notes?: string) => {
        const result = await AdminService.decide(advanceId, decision, reviewerUserId, notes)
        if (!result) return
        setAdvances((prev) => prev.map((a) => (a.id === result.advance.id ? result.advance : a)))
        setInvoices((prev) => prev.map((inv) => (inv.id === result.invoice.id ? result.invoice : inv)))
    }

    const updateAdvance = async (id: string, patch: Partial<AdvanceRequest>) => {
        setAdvances((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
        const res = await AdminService.updateAdvance(id, patch)
        if (res) setAdvances((prev) => prev.map((a) => (a.id === id ? res : a)))
        return res
    }

    const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)))
        const res = await AdminService.updateInvoice(id, patch)
        if (res) setInvoices((prev) => prev.map((inv) => (inv.id === id ? res : inv)))
        return res
    }

    const addReview = async (review: Omit<AdminReview, 'id' | 'createdAt'>) => {
        return await AdminService.addReview(review)
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
            users,
            loading,
            error,
            refetch: fetchAll,
            getAiSnapshot,
            decide,
            updateAdvance,
            updateInvoice,
            addReview,
            generateAiReview
        }}>
            {children}
        </AdminContext.Provider>
    )
}
