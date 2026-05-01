import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'
import { getStoredTokens, hasRequesterSessionSnapshot, restoreRequesterSession } from '../services'

export default function ProtectedRoute() {
    const { user, isInitialized, me } = useAuth()
    const location = useLocation()
    const [restoringRequesterSession, setRestoringRequesterSession] = useState(false)
    const [revalidatingAdmin, setRevalidatingAdmin] = useState(false)
    const isAdminOutsideAdminRoutes = Boolean(user?.role === 'Admin' && !location.pathname.startsWith('/admin'))
    const isEnteringAdminRoute = location.pathname.startsWith('/admin')

    // Re-validate admin session when entering admin routes with valid token but no user state
    useEffect(() => {
        if (!isInitialized || !isEnteringAdminRoute) return
        if (user) return // Already have user state
        
        const tokens = getStoredTokens()
        if (!tokens?.accessToken && !tokens?.access_token) return // No token to validate

        let active = true
        setRevalidatingAdmin(true)

        me()
            .catch((error) => {
                console.error('Failed to revalidate admin session:', error)
            })
            .finally(() => {
                if (active) setRevalidatingAdmin(false)
            })

        return () => {
            active = false
        }
    }, [isInitialized, isEnteringAdminRoute, user, me])

    useEffect(() => {
        if (!isInitialized || !isAdminOutsideAdminRoutes) return
        if (!hasRequesterSessionSnapshot()) return

        const restored = restoreRequesterSession()
        if (!restored) return

        let active = true
        setRestoringRequesterSession(true)

        me()
            .catch((error) => {
                console.error('Failed to restore requester session:', error)
            })
            .finally(() => {
                if (active) setRestoringRequesterSession(false)
            })

        return () => {
            active = false
        }
    }, [isAdminOutsideAdminRoutes, isInitialized, me])

    if (!isInitialized || restoringRequesterSession || revalidatingAdmin) {
        // Could return a loading spinner here
        return null
    }

    if (!user) {
        const redirectTo = location.pathname.startsWith('/admin') ? '/login/admin' : '/account-type'
        return <Navigate to={redirectTo} replace />
    }

    if (location.pathname.startsWith('/admin') && user.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />
    }

    if (!location.pathname.startsWith('/admin') && user.role === 'Admin') {
        if (hasRequesterSessionSnapshot()) {
            return null
        }

        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
