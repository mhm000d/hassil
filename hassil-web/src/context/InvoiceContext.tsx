import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Invoice } from '../types'
import { InvoiceService } from '../services'

interface InvoiceContextValue {
    invoices: Invoice[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    get: (id: string) => Promise<Invoice | undefined>
    create: (invoice: Invoice) => Promise<Invoice>
    update: (id: string, patch: Partial<Invoice>) => Promise<Invoice | undefined>
}

export const InvoiceContext = createContext<InvoiceContextValue>({
    invoices: [],
    loading: true,
    error: null,
    refetch: async () => {},
    get: async () => undefined,
    create: async (i) => i,
    update: async () => undefined,
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

    const get = async (id: string) => {
        return await InvoiceService.get(id)
    }

    const create = async (invoice: Invoice) => {
        const res = await InvoiceService.create(invoice)
        await fetchInvoices()
        return res
    }

    const update = async (id: string, patch: Partial<Invoice>) => {
        const res = await InvoiceService.update(id, patch)
        await fetchInvoices()
        return res
    }

    return (
        <InvoiceContext.Provider value={{ invoices, loading, error, refetch: fetchInvoices, get, create, update }}>
            {children}
        </InvoiceContext.Provider>
    )
}
