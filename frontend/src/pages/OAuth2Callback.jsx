import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { jwtDecode } from 'jwt-decode';
export default function OAuth2Callback() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        // Extract token from URL: /oauth2/callback?token=xxxxx
        const params = new URLSearchParams(window.location.search);
        const token  = params.get('token');

        if (token) {
            const decoded = jwtDecode(token);
            console.log('=== JWT DECODED ===', decoded);  // ← ADD
            console.log('=== role ===', decoded.role);     // ← ADD
            console.log('=== roles ===', decoded.roles);   // ← ADD
            login(token);                   // save JWT in auth context
            setTimeout(() => {
                navigate('/role-redirect');
            }, 100);     // redirect based on role
        } else {
            setError('Google login failed. No token received.');
            setTimeout(() => navigate('/'), 3000);
        }
    }, []);

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8', fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.1)', maxWidth: '400px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>Login Failed</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{error}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Redirecting to home...</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f4f8', fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #e5e7eb', borderTopColor: '#0a4f3a', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Signing you in with Google...</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Please wait</div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}