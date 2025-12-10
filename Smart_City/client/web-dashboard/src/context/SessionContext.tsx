import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  SessionUser,
  getCurrentSession,
  loginUser,
  logoutUser,
  registerUser,
  SESSION_STORAGE_KEY,
  bootstrapDemoSession,
} from '../utils/session';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { fullName: string; email: string; password: string };

type SessionContextValue = {
  user: SessionUser | null;
  login: (payload: LoginPayload) => SessionUser;
  register: (payload: RegisterPayload) => SessionUser;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getCurrentSession() ?? bootstrapDemoSession());

  const login = (payload: LoginPayload) => {
    const session = loginUser(payload);
    setUser(session);
    return session;
  };

  const register = (payload: RegisterPayload) => {
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

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SESSION_STORAGE_KEY) {
        return;
      }
      setUser(getCurrentSession());
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
