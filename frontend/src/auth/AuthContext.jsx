import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
               // setUser(decoded);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                } else {
                    localStorage.removeItem('token');
                }
            } catch {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    function login(token) {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser(decoded);
        const existing = localStorage.getItem('userInfo');
        if (!existing) {
            localStorage.setItem('userInfo', JSON.stringify({
                username: decoded.sub,
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
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);