import { createContext, useState, useEffect, useCallback, useContext, useMemo, type ReactNode } from 'react'
import type { Invoice, InvoiceDocument } from '../types'
import { InvoiceService, type AddInvoiceDocumentPayload, type CreateInvoicePayload } from '../services'
import { AuthContext } from './AuthContext'

interface InvoiceContextValue {
    invoices: Invoice[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    get: (id: string) => Promise<Invoice | undefined>
    create: (invoice: CreateInvoicePayload) => Promise<Invoice>
    addDocument: (id: string, document: AddInvoiceDocumentPayload) => Promise<InvoiceDocument>
    submit: (id: string) => Promise<Invoice>
    update: (id: string, patch: Partial<Invoice>) => Promise<Invoice | undefined>
}

export const InvoiceContext = createContext<InvoiceContextValue>({
    invoices: [],
    loading: true,
    error: null,
    refetch: async () => {},
    get: async () => undefined,
    create: async () => {
        throw new Error('Invoice provider is not ready')
    },
    addDocument: async () => {
        throw new Error('Invoice provider is not ready')
    },
    submit: async () => {
        throw new Error('Invoice provider is not ready')
    },
    update: async () => undefined,
})

export function InvoiceProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useContext(AuthContext)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInvoices = useCallback(async () => {
        if (!isInitialized) return
        if (!user) {
            setInvoices([])
            setLoading(false)
            setError(null)
            return
        }

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
    }, [isInitialized, user])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const get = useCallback(async (id: string) => {
        const invoice = await InvoiceService.get(id)
        setInvoices((current) => {
            const exists = current.some((item) => item.id === id)
            return exists
                ? current.map((item) => item.id === id ? invoice : item)
                : [invoice, ...current]
        })
        return invoice
    }, [])

    const create = useCallback(async (invoice: CreateInvoicePayload) => {
        const res = await InvoiceService.create(invoice)
        await fetchInvoices()
        return res
    }, [fetchInvoices])

    const addDocument = useCallback(async (id: string, document: AddInvoiceDocumentPayload) => {
        const res = await InvoiceService.addDocument(id, document)
        setInvoices((current) => current.map((invoice) => invoice.id === id
            ? {
                ...invoice,
                documents: [...invoice.documents, res],
                documentCount: (invoice.documentCount ?? invoice.documents.length) + 1,
            }
            : invoice))
        return res
    }, [])

    const submit = useCallback(async (id: string) => {
        const res = await InvoiceService.submit(id)
        setInvoices((current) => current.map((invoice) => invoice.id === id ? res : invoice))
        return res
    }, [])

    const update = useCallback(async (id: string, patch: Partial<Invoice>) => {
        let updated: Invoice | undefined
        setInvoices((current) => current.map((invoice) => {
            if (invoice.id !== id) return invoice
            updated = { ...invoice, ...patch }
            return updated
        }))
        return updated
    }, [])

    const value = useMemo<InvoiceContextValue>(() => ({
        invoices,
        loading,
        error,
        refetch: fetchInvoices,
        get,
        create,
        addDocument,
        submit,
        update,
    }), [invoices, loading, error, fetchInvoices, get, create, addDocument, submit, update])

    return (
        <InvoiceContext.Provider value={value}>
            {children}
        </InvoiceContext.Provider>
    )
}
