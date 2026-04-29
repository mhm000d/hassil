import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Invoice } from '../types'
import { InvoiceService } from '../services'

interface InvoiceContextValue {
    invoices: Invoice[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export const InvoiceContext = createContext<InvoiceContextValue>({
    invoices: [],
    loading: true,
    error: null,
    refetch: async () => {}
})

export function InvoiceProvider({ children }: { children: ReactNode }) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true)
            const data = await InvoiceService.list()
            setInvoices(data)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch invoices')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    return (
        <InvoiceContext.Provider value={{ invoices, loading, error, refetch: fetchInvoices }}>
            {children}
        </InvoiceContext.Provider>
    )
}
