import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthUser {
    name: string
    email: string
    accountType: 'Freelancer' | 'SmallBusiness'
}

interface AuthContextValue {
    user: AuthUser | null
    login: (user: AuthUser) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    login: () => {},
    logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)

    const login = (user: AuthUser) => setUser(user)
    const logout = () => setUser(null)

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
