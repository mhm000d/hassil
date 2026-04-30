import type { User } from '../types'
import { api } from './apiClient'

const TOKEN_KEY = 'hassil_tokens'

export interface Tokens {
    access_token: string
    refresh_token: string
}

export const getStoredTokens = (): Tokens | null => {
    const tokensJson = sessionStorage.getItem(TOKEN_KEY)
    return tokensJson ? JSON.parse(tokensJson) : null
}

export const updateAuthTokens = (tokens: Tokens | null): void => {
    if (!tokens) {
        sessionStorage.removeItem(TOKEN_KEY)
        return
    }
    try {
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    } catch (error) {
        console.error('Failed to update auth tokens:', error)
        sessionStorage.removeItem(TOKEN_KEY)
    }
}

export const AuthService = {
    signup: async (payload: any): Promise<Tokens> => {
        return await api.post<Tokens>('/auth/signup', payload, { authRequired: false })
    },

    login: async (payload: any): Promise<Tokens> => {
        const credentials = new URLSearchParams({ username: payload.email, password: payload.password })
        return await api.post<Tokens>('/auth/login', credentials, { authRequired: false })
    },

    logout: async (): Promise<void> => {
        return await api.del('/auth/logout', { authRequired: false })
    },

    me: async (): Promise<User> => {
        return await api.get<User>('/auth/me')
    },

    completeProfile: async (payload: { email: string, displayName: string }): Promise<void> => {
        return await api.put('/auth/me', payload)
    }
}
