import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthService, getStoredTokens, updateAuthTokens } from '../services'
import type { Tokens } from '../services'

export interface AuthUser {
    name: string
    displayName: string
    email: string
    accountType: 'Freelancer' | 'SmallBusiness' | 'Admin'
}

export const AuthStatus = {
    LOGGED_OUT: 'LOGGED_OUT',
    LOGGED_IN: 'LOGGED_IN',
    ACTIVE: 'ACTIVE',
    ERROR: 'ERROR'
} as const

export type AuthStatus = typeof AuthStatus[keyof typeof AuthStatus]

interface AuthContextValue {
    user: AuthUser | null
    authStatus: AuthStatus
    isInitialized: boolean
    error: string | null
    me: () => Promise<void>
    login: (credentials: any) => Promise<void>
    logout: () => Promise<void>
    signup: (payload: any) => Promise<void>
    completeProfile: (payload: { email: string, displayName: string }) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    authStatus: AuthStatus.LOGGED_OUT,
    isInitialized: false,
    error: null,
    me: async () => {},
    login: async () => {},
    logout: async () => {},
    signup: async () => {},
    completeProfile: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOGGED_OUT)
    const [isInitialized, setIsInitialized] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function updateState(type: 'login' | 'signup' | 'logout' | 'me', value?: Tokens | AuthUser) {
        switch (type) {
            case 'login':
            case 'signup':
                updateAuthTokens(value as Tokens)
                setAuthStatus(AuthStatus.LOGGED_IN)
                break
            case 'logout':
                setUser(null)
                updateAuthTokens(null)
                setAuthStatus(AuthStatus.LOGGED_OUT)
                break
            case 'me':
                setUser(value as AuthUser)
                setAuthStatus(AuthStatus.ACTIVE)
                break
        }
    }

    const me = useCallback(async () => {
        try {
            const tokens = getStoredTokens()
            if (!tokens?.access_token) {
                setAuthStatus(AuthStatus.LOGGED_OUT)
                return
            }
            const fetchedUser = await AuthService.me()
            updateState('me', fetchedUser)
        } catch (err) {
            console.error('Failed to fetch user:', err)
            setAuthStatus(AuthStatus.LOGGED_OUT)
        }
    }, [])

    const login = useCallback(async (credentials: any) => {
        try {
            setError(null)
            const tokens = await AuthService.login(credentials)
            if (!tokens?.access_token) throw new Error('Invalid response')
            updateState('login', tokens)
            await me()
        } catch (err: any) {
            setError(err.message)
            setAuthStatus(AuthStatus.ERROR)
            throw err
        }
    }, [me])

    const signup = useCallback(async (payload: any) => {
        try {
            setError(null)
            const tokens = await AuthService.signup(payload)
            if (!tokens?.access_token) throw new Error('Invalid response')
            updateState('signup', tokens)
            await me()
        } catch (err: any) {
            setError(err.message)
            setAuthStatus(AuthStatus.ERROR)
            throw err
        }
    }, [me])

    const logout = useCallback(async () => {
        try {
            await AuthService.logout()
            updateState('logout')
        } catch (err) {
            console.error(err)
        }
    }, [])

    const completeProfile = useCallback(async (payload: { email: string, displayName: string }) => {
        try {
            setError(null)
            await AuthService.completeProfile(payload)
            await me()
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }, [me])

    useEffect(() => {
        const init = async () => {
            const tokens = getStoredTokens()
            if (tokens?.access_token) {
                setAuthStatus(AuthStatus.LOGGED_IN)
                await me()
            }
            setIsInitialized(true)
        }
        init()
    }, [me])

    return (
        <AuthContext.Provider value={{ user, authStatus, isInitialized, error, me, login, logout, signup, completeProfile }}>
            {children}
        </AuthContext.Provider>
    )
}


