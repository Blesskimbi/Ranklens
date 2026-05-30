import { createContext, useContext, useState, useCallback } from 'react';
import { getStoredUser, getStoredToken, saveAuth, clearAuth } from '../lib/auth';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());

  const login = useCallback((userData, accessToken) => {
    saveAuth(userData, accessToken || '__demo__');
    setUser(userData);
    setToken(accessToken || '__demo__');
    if (accessToken && accessToken !== '__demo__') {
      localStorage.setItem('gsc_token', accessToken);
      localStorage.setItem('ga4_token', accessToken);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
