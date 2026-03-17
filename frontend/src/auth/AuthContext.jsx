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
        console.log('✅ JWT Decoded:', decoded); // ← sirf ye line add ki
        setUser(decoded);
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);