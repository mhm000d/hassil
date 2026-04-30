import { getStoredTokens } from './authService'

type QueryValue = string | number | boolean | undefined | null

interface RequestOptions {
    authRequired?: boolean
    params?: Record<string, QueryValue>
    headers?: Record<string, string>
}

interface ApiRequestOptions extends RequestOptions {
    method?: string
    body?: BodyInit | unknown
}

interface BackendErrorResponse {
    error?: string
    code?: string
    details?: unknown
    traceId?: string
}

export class ApiError extends Error {
    status: number
    code?: string
    details?: unknown
    traceId?: string

    constructor(message: string, status: number, response?: BackendErrorResponse) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = response?.code
        this.details = response?.details
        this.traceId = response?.traceId
    }
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function apiClient<T>(
    endpoint: string,
    {
        authRequired = true,
        method = 'GET',
        body,
        params,
        headers = {},
    }: ApiRequestOptions = {},
): Promise<T> {
    const url = buildUrl(endpoint, params)
    const requestHeaders = new Headers(headers)

    if (authRequired) {
        const token = getAccessToken()
        if (!token) throw new ApiError('Authentication required', 401)
        requestHeaders.set('Authorization', `Bearer ${token}`)
    }

    const requestInit: RequestInit = {
        method,
        headers: requestHeaders,
    }

    if (body !== undefined) {
        requestInit.body = serializeBody(body, requestHeaders)
    }

    const response = await fetch(url, requestInit)

    if (!response.ok) {
        const errorResponse = await readErrorResponse(response)
        throw new ApiError(
            errorResponse?.error ?? `Request failed with status ${response.status}`,
            response.status,
            errorResponse,
        )
    }

    if (response.status === 204) {
        return undefined as T
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
        return (await response.text()) as T
    }

    return (await response.json()) as T
}

function buildUrl(endpoint: string, params?: Record<string, QueryValue>) {
    const path = normalizeEndpoint(endpoint)
    const url = new URL(path, apiBaseUrl || window.location.origin)

    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value))
        }
    })

    return apiBaseUrl ? url.toString() : `${url.pathname}${url.search}`
}

function normalizeEndpoint(endpoint: string) {
    if (/^https?:\/\//i.test(endpoint)) return endpoint
    if (endpoint.startsWith('/api/')) return endpoint

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `/api${path}`
}

function serializeBody(body: BodyInit | unknown, headers: Headers): BodyInit {
    if (
        typeof body === 'string'
        || body instanceof FormData
        || body instanceof URLSearchParams
        || body instanceof Blob
        || body instanceof ArrayBuffer
    ) {
        return body
    }

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    return JSON.stringify(body)
}

async function readErrorResponse(response: Response): Promise<BackendErrorResponse | undefined> {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
        const text = await response.text()
        return text ? { error: text } : undefined
    }

    try {
        return await response.json()
    } catch {
        return undefined
    }
}

function getAccessToken() {
    const tokens = getStoredTokens() as { accessToken?: string; access_token?: string } | null
    return tokens?.accessToken ?? tokens?.access_token
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

    patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

    del: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}
