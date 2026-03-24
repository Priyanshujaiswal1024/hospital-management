import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const BASE_URL = "https://hospital-management-0rx3.onrender.com";

// Warm-up utility
export async function warmUpServer(onStatus) {
    try {
        onStatus?.("Server start ho raha hai, please wait... ⏳");
        await fetch(`${BASE_URL}/api/v1/actuator/health`, {
            signal: AbortSignal.timeout(60000)
        });
        onStatus?.("");
        return true;
    } catch {
        onStatus?.("");
        return false;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    // App open hote hi server jagao
    useEffect(() => {
        fetch(`${BASE_URL}/api/v1/actuator/health`).catch(() => {});
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
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