import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('catlink_current_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const apiUser = await loginUser(email, password);
        if (!apiUser) return { success: false, message: 'Login failed. API unavailable.' };
        if (apiUser.isBlocked) return { success: false, message: 'Account blocked. Contact support.' };
        localStorage.setItem('catlink_current_user', JSON.stringify(apiUser));
        setUser(apiUser);
        return { success: true };
    };

    const logout = () => {
        localStorage.removeItem('catlink_current_user');
        setUser(null);
    };

    const updateUsers = (updatedUsers) => {
        localStorage.setItem('catlink_users', JSON.stringify(updatedUsers));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUsers }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
