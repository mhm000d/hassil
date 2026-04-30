import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, AuthStatus } from '../hooks'

export default function ProtectedRoute() {
    const { authStatus, isInitialized } = useAuth()

    if (!isInitialized) {
        return null
    }

    if (authStatus === AuthStatus.LOGGED_OUT || authStatus === AuthStatus.ERROR) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
