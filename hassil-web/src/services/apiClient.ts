import { getStoredTokens } from './authService'
import { mockApi, authApi, generateId } from '../data/mockApi'
import type { Invoice, AdvanceRequest } from '../types'

// Fake delay to simulate network latency
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

interface RequestOptions {
    authRequired?: boolean
    params?: Record<string, string | number | boolean | undefined>
    headers?: Record<string, string>
}

async function apiClient<T>(endpoint: string, { authRequired = true, method = 'GET', body }: RequestOptions & { method?: string; body?: any } = {}): Promise<T> {
    await delay()

    let userId: string | undefined = undefined

    if (authRequired) {
        const tokens = getStoredTokens()
        if (!tokens?.access_token) {
            throw new Error('Authentication required')
        }
        // In mock, token might be the ID or the email. Resolve to real ID.
        const authUser = authApi.me(tokens.access_token)
        userId = authUser?.id || tokens.access_token
    }

    try {
        // --- Auth Routes ---
        if (endpoint === '/auth/me' && method === 'GET') {
            const authUser = authApi.me(userId!)
            if (!authUser) throw new Error('User not found')
            return authUser as T
        }
        if (endpoint === '/auth/me' && method === 'PUT') {
            const payload = JSON.parse(body)
            authApi.completeProfile(payload)
            return null as T
        }
        if (endpoint === '/auth/login' && method === 'POST') {
            const params = new URLSearchParams(body)
            const result = authApi.login(params.get('username') || '', params.get('password') || '')
            if (!result.success) throw new Error(result.error)
            return { access_token: result.user!.id, refresh_token: 'fake-refresh-token' } as T
        }
        if (endpoint === '/auth/signup' && method === 'POST') {
            const payload = JSON.parse(body)
            const result = authApi.register(payload)
            if (!result.success) throw new Error(result.error)
            return { access_token: result.user!.id, refresh_token: 'fake-refresh-token' } as T
        }
        if (endpoint === '/auth/logout' && method === 'DELETE') {
            return null as T
        }

        // --- Dashboard ---
        if (endpoint === '/dashboard/summary' && method === 'GET') {
            const res = await mockApi.getDashboardSummary(userId!)
            return res.data as T
        }

        // --- Invoices ---
        if (endpoint === '/invoices' && method === 'GET') {
            const res = await mockApi.listInvoices(userId)
            return res.data as T
        }
        if (endpoint.startsWith('/invoices/') && method === 'GET') {
            const id = endpoint.split('/')[2]
            const res = await mockApi.getInvoice(id)
            return res.data as T
        }
        if (endpoint === '/invoices' && method === 'POST') {
            const payload = JSON.parse(body)
            const res = await mockApi.createInvoice({ ...payload, userId: userId! } as Invoice)
            return res.data as T
        }
        if (endpoint.startsWith('/invoices/') && (method === 'PUT' || method === 'PATCH')) {
            const id = endpoint.split('/')[2]
            const payload = JSON.parse(body)
            const res = await mockApi.updateInvoice(id, payload)
            return res.data as T
        }

        // --- Advances ---
        if (endpoint === '/advances' && method === 'GET') {
            const res = await mockApi.listAdvanceRequests(userId)
            return res.data as T
        }
        if (endpoint.startsWith('/advances/') && method === 'GET') {
            const id = endpoint.split('/')[2]
            const res = await mockApi.getAdvanceRequest(id)
            return res.data as T
        }
        if (endpoint === '/advances' && method === 'POST') {
            const payload = JSON.parse(body)
            const res = await mockApi.createAdvanceRequest({ ...payload, userId: userId! } as AdvanceRequest)
            return res.data as T
        }
        if (endpoint.startsWith('/advances/') && (method === 'PUT' || method === 'PATCH')) {
            const id = endpoint.split('/')[2]
            const payload = JSON.parse(body)
            const res = await mockApi.updateAdvanceRequest(id, payload)
            return res.data as T
        }

        // --- Transactions ---
        if (endpoint === '/transactions' && method === 'GET') {
            const res = await mockApi.listTransactions(userId)
            return res.data as T
        }

        // --- Admin Global Fetching ---
        if (endpoint === '/admin/invoices' && method === 'GET') {
            const res = await mockApi.listInvoices()
            return res.data as T
        }
        if (endpoint === '/admin/advances' && method === 'GET') {
            const res = await mockApi.listAdvanceRequests()
            return res.data as T
        }
        if (endpoint === '/admin/ai-snapshots' && method === 'GET') {
            const res = await mockApi.listAiSnapshots()
            return res.data as T
        }
        if (endpoint.startsWith('/ai-snapshots/') && method === 'GET') {
            const id = endpoint.split('/')[2]
            const res = await mockApi.getAiSnapshot(id)
            return res.data as T
        }

        // --- Admin Reviews ---
        if (endpoint === '/admin-reviews' && method === 'POST') {
            const payload = JSON.parse(body)
            const res = await mockApi.addAdminReview({ ...payload, id: generateId('rev'), createdAt: new Date().toISOString() })
            return res.data as T
        }
        if (endpoint === '/ai-snapshots' && method === 'GET') {
            const res = await mockApi.listAiSnapshots()
            return res.data as T
        }

        // --- Public / Client Confirmation ---
        if (endpoint.startsWith('/public/confirm/') && method === 'GET') {
            const token = endpoint.split('/')[3]
            const res = await mockApi.getClientConfirmation(token)
            return res.data as T
        }
        if (endpoint.startsWith('/public/confirm/') && method === 'POST') {
            const token = endpoint.split('/')[3]
            const payload = JSON.parse(body)
            await mockApi.updateClientConfirmation(token, payload)
            return null as T
        }

        throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`)
    } catch (error) {
        console.error('API request failed:', endpoint, error)
        throw error
    }
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'POST', body: typeof body === 'string' || body instanceof URLSearchParams ? body : JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    del: <T>(endpoint: string, options?: RequestOptions) => apiClient<T>(endpoint, { ...options, method: 'DELETE' })
}

