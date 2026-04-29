import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface AuthUser {
    name: string          // contact person name (used for login)
    displayName: string   // company name for SMB, freelancer name for Freelancer
    email: string
    accountType: 'Freelancer' | 'SmallBusiness' | 'Admin'
}

interface AuthContextValue {
    user: AuthUser | null
    isInitialized: boolean
    login: (user: AuthUser) => void
    logout: () => void
}

const STORAGE_KEY = 'hassil_auth_user'

const AuthContext = createContext<AuthContextValue>({
    user: null,
    isInitialized: false,
    login: () => {},
    logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                setUser(JSON.parse(raw) as AuthUser)
            }
        } catch (error) {
            console.error('Failed to parse stored user:', error)
        } finally {
            setIsInitialized(true)
        }
    }, [])

    const login = (newUser: AuthUser) => {
        setUser(newUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    return (
        <AuthContext.Provider value={{ user, isInitialized, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
