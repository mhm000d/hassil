import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks'

/**
 * Restricts access to admin-only routes.
 * Non-admin authenticated users are redirected to /dashboard.
 */
export default function AdminRoute() {
    const { user } = useAuth()

    if (user?.role !== 'Admin') {
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}
