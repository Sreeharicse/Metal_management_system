import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, role, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="container">Loading authentication...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (requiredRole && role !== requiredRole) {
        // If admin tries to go to user dash, or user to admin dash
        if (role === 'admin') return <Navigate to="/admin" replace />
        if (role === 'user') return <Navigate to="/user" replace />
        return <Navigate to="/" replace />
    }

    return children
}
