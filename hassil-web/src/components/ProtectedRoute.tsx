import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'

export default function ProtectedRoute() {
    const { user, isInitialized } = useAuth()
    const location = useLocation()

    if (!isInitialized) {
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

    return <Outlet />
}
