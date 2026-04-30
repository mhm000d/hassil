import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
    AuthService,
    getStoredTokens,
    tokensFromAuthResponse,
    updateAuthTokens,
    type AuthResponse,
    type FreelancerOnboardingPayload,
    type LoginPayload,
    type SmallBusinessOnboardingPayload
} from '../services'
import type { User } from '../types'

export const AuthStatus = {
    LOGGED_OUT: 'LOGGED_OUT',
    LOGGED_IN: 'LOGGED_IN',
    ACTIVE: 'ACTIVE',
    ERROR: 'ERROR'
} as const

export type AuthStatus = typeof AuthStatus[keyof typeof AuthStatus]

interface AuthContextValue {
    user: User | null
    authStatus: AuthStatus
    isInitialized: boolean
    error: string | null
    me: () => Promise<void>
    login: (credentials: LoginPayload) => Promise<void>
    logout: () => Promise<void>
    onboardSmallBusiness: (payload: SmallBusinessOnboardingPayload) => Promise<void>
    onboardFreelancer: (payload: FreelancerOnboardingPayload) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    authStatus: AuthStatus.LOGGED_OUT,
    isInitialized: false,
    error: null,
    me: async () => {},
    login: async () => {},
    logout: async () => {},
    onboardSmallBusiness: async () => {},
    onboardFreelancer: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthStatus.LOGGED_OUT)
    const [isInitialized, setIsInitialized] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const applyAuthResponse = useCallback((response: AuthResponse) => {
        updateAuthTokens(tokensFromAuthResponse(response))
        setUser(response.user)
        setAuthStatus(AuthStatus.ACTIVE)
    }, [])

    const clearAuthState = useCallback(() => {
        setUser(null)
        updateAuthTokens(null)
        setAuthStatus(AuthStatus.LOGGED_OUT)
    }, [])

    const me = useCallback(async () => {
        try {
            const tokens = getStoredTokens()
            if (!tokens?.accessToken && !tokens?.access_token) {
                clearAuthState()
                return
            }
            const fetchedUser = await AuthService.me()
            setUser(fetchedUser)
            setAuthStatus(AuthStatus.ACTIVE)
        } catch (err) {
            console.error('Failed to fetch user:', err)
            clearAuthState()
        }
    }, [clearAuthState])

    const login = useCallback(async (credentials: LoginPayload) => {
        try {
            setError(null)
            const response = await AuthService.login(credentials)
            if (!response?.accessToken) throw new Error('Invalid login response')
            applyAuthResponse(response)
        } catch (err: any) {
            setError(err.message)
            setAuthStatus(AuthStatus.ERROR)
            throw err
        }
    }, [applyAuthResponse])

    const onboardSmallBusiness = useCallback(async (payload: SmallBusinessOnboardingPayload) => {
        try {
            setError(null)
            const response = await AuthService.onboardSmallBusiness(payload)
            if (!response?.accessToken) throw new Error('Invalid onboarding response')
            applyAuthResponse(response)
        } catch (err: any) {
            setError(err.message)
            setAuthStatus(AuthStatus.ERROR)
            throw err
        }
    }, [applyAuthResponse])

    const onboardFreelancer = useCallback(async (payload: FreelancerOnboardingPayload) => {
        try {
            setError(null)
            const response = await AuthService.onboardFreelancer(payload)
            if (!response?.accessToken) throw new Error('Invalid onboarding response')
            applyAuthResponse(response)
        } catch (err: any) {
            setError(err.message)
            setAuthStatus(AuthStatus.ERROR)
            throw err
        }
    }, [applyAuthResponse])

    const logout = useCallback(async () => {
        try {
            await AuthService.logout()
            clearAuthState()
        } catch (err) {
            console.error(err)
        }
    }, [clearAuthState])

    useEffect(() => {
        const init = async () => {
            const tokens = getStoredTokens()
            if (tokens?.accessToken || tokens?.access_token) {
                setAuthStatus(AuthStatus.LOGGED_IN)
                await me()
            }
            setIsInitialized(true)
        }
        init()
    }, [me])

    return (
        <AuthContext.Provider value={{
            user,
            authStatus,
            isInitialized,
            error,
            me,
            login,
            logout,
            onboardSmallBusiness,
            onboardFreelancer
        }}>
            {children}
        </AuthContext.Provider>
    )
}
