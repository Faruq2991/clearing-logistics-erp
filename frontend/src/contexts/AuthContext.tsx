import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

interface User {
  email: string;
  role: string;
  first_name: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const { token: tokenData, user: userData } = data;
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData.access_token);
    setUser(userData);
    queryClient.clear();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};