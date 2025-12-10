import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentSession, loginUser, logoutUser, registerUser, SESSION_STORAGE_KEY, bootstrapDemoSession, } from '../utils/session';
const SessionContext = createContext(undefined);
export function SessionProvider({ children }) {
    const [user, setUser] = useState(() => getCurrentSession() ?? bootstrapDemoSession());
    const login = (payload) => {
        const session = loginUser(payload);
        setUser(session);
        return session;
    };
    const register = (payload) => {
        const session = registerUser(payload);
        setUser(session);
        return session;
    };
    const logout = () => {
        logoutUser();
        setUser(null);
    };
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        function handleStorage(event) {
            if (event.key && event.key !== SESSION_STORAGE_KEY) {
                return;
            }
            setUser(getCurrentSession());
        }
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    const value = useMemo(() => ({ user, login, register, logout }), [user]);
    return _jsx(SessionContext.Provider, { value: value, children: children });
}
export function useSession() {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
