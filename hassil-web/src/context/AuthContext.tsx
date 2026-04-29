import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthUser {
    name: string          // contact person name (used for login)
    displayName: string   // company name for SMB, freelancer name for Freelancer
    email: string
    accountType: 'Freelancer' | 'SmallBusiness'
}

interface AuthContextValue {
    user: AuthUser | null
    login: (user: AuthUser) => void
    logout: () => void
}

const STORAGE_KEY = 'hassil_auth_user'

function loadUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
        return null
    }
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    login: () => {},
    logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(loadUser)

    const login = (user: AuthUser) => {
        setUser(user)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
