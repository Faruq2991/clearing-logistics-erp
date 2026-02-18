import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): User | null {
  try {
    const decoded: { sub: string; role: string } = jwtDecode(token);
    return { email: decoded.sub, role: decoded.role };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token')
  );
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (token) {
      const decodedUser = decodeToken(token);
      setUser(decodedUser);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const t = data.access_token;
    localStorage.setItem('access_token', t);
    setToken(t);
    const decodedUser = decodeToken(t);
    setUser(decodedUser);
    queryClient.clear();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
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