import { getStoredTokens } from './authService'
import { mockApi, authApi } from '../data/mockApi'
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
        userId = tokens.access_token // In mock, token IS the user ID
    }

    try {
        // --- Auth Routes ---
        if (endpoint === '/auth/me' && method === 'GET') {
            const users = JSON.parse(localStorage.getItem('hassil_registered_users') ?? '[]')
            const authUser = users.find((u: any) => u.email === userId) // userId is the email token
            const mockUser = mockUsers.find(u => u.email === userId || u.id === userId)

            if (!authUser && !mockUser) throw new Error('User not found')

            const baseUser = mockUser || { id: `u-${Date.now()}`, trustScore: 100 }

            return {
                ...baseUser,
                name: authUser?.name || mockUser?.smallBusinessProfile?.businessName || mockUser?.freelancerProfile?.fullName,
                displayName: authUser?.displayName || mockUser?.smallBusinessProfile?.businessName || mockUser?.freelancerProfile?.fullName,
                email: authUser?.email || mockUser?.email,
                accountType: authUser?.accountType || mockUser?.accountType
            } as T
        }
        if (endpoint === '/auth/me' && method === 'PUT') {
            const payload = JSON.parse(body)
            authApi.updateDisplayName(payload.email, payload.displayName)
            return null as T
        }
        if (endpoint === '/auth/login' && method === 'POST') {
            const params = new URLSearchParams(body)
            const result = authApi.login(params.get('username') || '', params.get('password') || '')
            if (!result.success) throw new Error(result.error)
            return { access_token: result.user!.email, refresh_token: 'fake-refresh-token' } as T
        }
        if (endpoint === '/auth/signup' && method === 'POST') {
            const payload = JSON.parse(body)
            const result = authApi.register(payload)
            if (!result.success) throw new Error(result.error)
            return { access_token: payload.email, refresh_token: 'fake-refresh-token' } as T
        }
        if (endpoint === '/auth/logout' && method === 'DELETE') {
            return null as T
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
            const res = await mockApi.createInvoice(JSON.parse(body) as Invoice)
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
            const res = await mockApi.createAdvanceRequest(JSON.parse(body) as AdvanceRequest)
            return res.data as T
        }

        // --- Transactions ---
        if (endpoint === '/transactions' && method === 'GET') {
            const res = await mockApi.listTransactions(userId)
            return res.data as T
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

// Temporary import for mock tokens fallback
import { mockUsers } from '../data/mockApi'
