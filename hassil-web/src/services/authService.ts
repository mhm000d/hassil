import type { User } from '../types'
import { api } from './apiClient'

const TOKEN_KEY = 'hassil_tokens'
const REQUESTER_SESSION_KEY = 'hassil_requester_session'

export interface Tokens {
    accessToken: string
    expiresAt?: string
    access_token?: string
    refresh_token?: string
}

export interface AuthResponse {
    accessToken: string
    expiresAt: string
    user: User
}

export interface LoginPayload {
    email?: string
    password?: string
    persona?: string
}

export interface SmallBusinessOnboardingPayload {
    email: string
    businessName: string
    registrationNumber: string
    phone?: string
    country?: string
    businessBankAccountName?: string
    businessBankAccountLast4?: string
}

export interface FreelancerOnboardingPayload {
    email: string
    fullName: string
    phone?: string
    country?: string
    personalBankAccountName?: string
    personalBankAccountLast4?: string
}

export const getStoredTokens = (): Tokens | null => {
    const tokensJson = localStorage.getItem(TOKEN_KEY)
    return tokensJson ? JSON.parse(tokensJson) : null
}

export const updateAuthTokens = (tokens: Tokens | null): void => {
    if (!tokens) {
        localStorage.removeItem(TOKEN_KEY)
        return
    }
    try {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    } catch (error) {
        console.error('Failed to update auth tokens:', error)
        localStorage.removeItem(TOKEN_KEY)
    }
}

export const tokensFromAuthResponse = (response: AuthResponse): Tokens => ({
    accessToken: response.accessToken,
    expiresAt: response.expiresAt
})

export const saveRequesterSession = (user: User | null): void => {
    const tokens = getStoredTokens()
    if (!user || user.role === 'Admin' || !tokens?.accessToken) return

    localStorage.setItem(REQUESTER_SESSION_KEY, JSON.stringify({
        tokens,
        userId: user.id,
        savedAt: new Date().toISOString()
    }))
}

export const restoreRequesterSession = (): boolean => {
    const sessionJson = localStorage.getItem(REQUESTER_SESSION_KEY)
    if (!sessionJson) return false

    try {
        const session = JSON.parse(sessionJson) as { tokens?: Tokens }
        if (!session.tokens?.accessToken) return false

        updateAuthTokens(session.tokens)
        return true
    } catch (error) {
        console.error('Failed to restore requester session:', error)
        return false
    } finally {
        localStorage.removeItem(REQUESTER_SESSION_KEY)
    }
}

export const AuthService = {
    demoLogin: async (persona: string): Promise<AuthResponse> => {
        return await api.post<AuthResponse>('/auth/demo-login', { persona }, { authRequired: false })
    },

    login: async (payload: LoginPayload): Promise<AuthResponse> => {
        return await AuthService.demoLogin(resolveDemoPersona(payload))
    },

    onboardSmallBusiness: async (payload: SmallBusinessOnboardingPayload): Promise<AuthResponse> => {
        return await api.post<AuthResponse>('/onboarding/small-business', payload, { authRequired: false })
    },

    onboardFreelancer: async (payload: FreelancerOnboardingPayload): Promise<AuthResponse> => {
        return await api.post<AuthResponse>('/onboarding/freelancer', payload, { authRequired: false })
    },

    logout: async (): Promise<void> => {
        updateAuthTokens(null)
    },

    me: async (): Promise<User> => {
        return await api.get<User>('/users/me')
    }
}

function resolveDemoPersona(payload: LoginPayload) {
    const value = String(payload?.persona ?? payload?.email ?? '').trim().toLowerCase()

    if (
        value.includes('admin')
        || value.includes('review')
        || value === 'review@hassil.co'
        || value === 'admin@hassil.io'
    ) {
        return 'admin'
    }

    if (
        value.includes('freelancer')
        || value.includes('sara')
        || value === 'sara@saradesigns.co'
        || value === 'sara@saradesigns.io'
    ) {
        return 'freelancer'
    }

    return 'small_business'
}
