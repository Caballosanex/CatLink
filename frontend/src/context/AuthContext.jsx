import { createContext, useContext, useState, useEffect } from 'react';
import { seedLocalStorage } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        seedLocalStorage();
        const stored = localStorage.getItem('voltgrid_current_user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        const users = JSON.parse(localStorage.getItem('voltgrid_users') || '[]');
        const found = users.find(
            (u) => u.email === email && u.password === password
        );
        if (!found) return { success: false, message: 'Invalid email or password' };
        if (found.isBlocked) return { success: false, message: 'Account blocked. Contact support.' };

        const sessionUser = { ...found };
        delete sessionUser.password;
        localStorage.setItem('voltgrid_current_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true };
    };

    const logout = () => {
        localStorage.removeItem('voltgrid_current_user');
        setUser(null);
    };

    const updateUsers = (updatedUsers) => {
        localStorage.setItem('voltgrid_users', JSON.stringify(updatedUsers));
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
