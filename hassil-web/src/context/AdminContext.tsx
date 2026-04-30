import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react'
import type { AdvanceRequest, Invoice, AiReviewSnapshot, AdminReview } from '../types'
import { AdminService } from '../services/adminService'
import { AuthContext } from './AuthContext'

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
}

export const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useContext(AuthContext)
    const [advances, setAdvances] = useState<AdvanceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isAdmin = user?.role === 'Admin'

    const fetchAll = useCallback(async () => {
        if (!isInitialized) return

        if (!isAdmin) {
            setAdvances([])
            setLoading(false)
            setError(null)
            return
        }

        try {
            setLoading(true)
            const pending = await AdminService.listPending()
            setAdvances(pending)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch admin review queue')
        } finally {
            setLoading(false)
        }
    }, [isAdmin, isInitialized])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const getAiSnapshot = async (advanceId: string) => {
        const detail = await AdminService.getDetail(advanceId)
        return detail.latestAiReview
    }

    const updateAdvance = async (id: string, patch: Partial<AdvanceRequest>) => {
        let detail

        if (patch.status === 'Approved') {
            detail = await AdminService.approve(id)
        } else if (patch.status === 'Rejected') {
            detail = await AdminService.reject(id, patch.rejectionReason ?? 'Rejected by admin reviewer.')
        } else {
            detail = await AdminService.getDetail(id)
        }

        await fetchAll()
        return detail.advanceRequest
    }

    const updateInvoice = async () => undefined

    const addReview = async (review: Omit<AdminReview, 'id' | 'createdAt'>) => {
        const detail = review.decision === 'RequestMoreInfo'
            ? await AdminService.requestMoreInfo(review.advanceRequestId, review.notes)
            : await AdminService.getDetail(review.advanceRequestId)

        await fetchAll()
        return detail.adminReviews[0] ?? {
            id: '',
            advanceRequestId: review.advanceRequestId,
            reviewerUserId: review.reviewerUserId,
            decision: review.decision,
            notes: review.notes,
            createdAt: new Date().toISOString(),
        }
    }

    return (
        <AdminContext.Provider value={{
            advances,
            invoices: [],
            aiSnapshots: [],
            loading,
            error,
            refetch: fetchAll,
            getAiSnapshot,
            updateAdvance,
            updateInvoice,
            addReview,
        }}>
            {children}
        </AdminContext.Provider>
    )
}
