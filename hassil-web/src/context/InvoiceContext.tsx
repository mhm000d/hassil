import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react'
import type { Invoice } from '../types'
import { InvoiceService } from '../services'
import { AuthContext } from './AuthContext'

interface InvoiceContextValue {
    invoices: Invoice[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    get: (id: string) => Promise<Invoice | undefined>
    create: (invoice: Invoice) => Promise<Invoice>
    update: (id: string, patch: Partial<Invoice>) => Promise<Invoice | undefined>
    submit: (id: string) => Promise<Invoice | undefined>
    addDocument: (id: string, doc: { fileName: string; documentType: string }) => Promise<Invoice | undefined>
    createClientConfirmation: (id: string, clientEmail: string) => Promise<Invoice | undefined>
}

export const InvoiceContext = createContext<InvoiceContextValue>({
    invoices: [],
    loading: true,
    error: null,
    refetch: async () => {},
    get: async () => undefined,
    create: async (i) => i,
    update: async () => undefined,
    submit: async () => undefined,
    addDocument: async () => undefined,
    createClientConfirmation: async () => undefined,
})

export function InvoiceProvider({ children }: { children: ReactNode }) {
    const { user } = useContext(AuthContext)
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

    // Re-fetch whenever the logged-in user changes (login, logout, account switch)
    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices, user?.id])

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

    const submit = async (id: string) => {
        const res = await InvoiceService.submit(id)
        await fetchInvoices()
        return res
    }

    const addDocument = async (id: string, doc: { fileName: string; documentType: string }) => {
        const res = await InvoiceService.addDocument(id, doc)
        await fetchInvoices()
        return res
    }

    const createClientConfirmation = async (id: string, clientEmail: string) => {
        const res = await InvoiceService.createClientConfirmation(id, clientEmail)
        await fetchInvoices()
        return res
    }

    return (
        <InvoiceContext.Provider value={{ invoices, loading, error, refetch: fetchInvoices, get, create, update, submit, addDocument, createClientConfirmation }}>
            {children}
        </InvoiceContext.Provider>
    )
}
