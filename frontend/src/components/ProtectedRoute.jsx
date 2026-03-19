import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export default function ProtectedRoute({ allowedRole, children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/" replace />;

    // ✅ Handle both JWT formats (normal login + Google OAuth)
    const role = user.role                          // "PATIENT"
        || user.role?.[0]?.replace('ROLE_', '')    // "ROLE_PATIENT" → "PATIENT"
        || '';

    if (allowedRole && role !== allowedRole)
        return <Navigate to="/" replace />;

    return children;
}