import { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try { return jwtDecode(token); } catch { return null; }
    });

    function login(token) {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser(decoded);

        // Only set userInfo if not already set by signup
        // (signup sets fullName + phone, login only has email)
        const existing = localStorage.getItem('userInfo');
        if (!existing) {
            localStorage.setItem('userInfo', JSON.stringify({
                username: decoded.sub,  // email
                fullName: '',
                phone:    '',
            }));
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);