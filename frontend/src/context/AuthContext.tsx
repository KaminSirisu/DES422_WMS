import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken } from '../services/api';
import { authService } from '../services/auth.service';
import type { LoginPayload, TokenPayload, Role } from '../types';

interface AuthUser {
  id: number;
  role: Role;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  // backward compat
  loginUser: (token: string) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeUser(token: string): AuthUser | null {
  try {
    const payload: TokenPayload = authService.decodeToken(token);
    if (!payload?.id) return null;
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

const TOKEN_KEYS = ['token', 'jwt_token'];

function getStoredToken(): string | null {
  for (const key of TOKEN_KEYS) {
    const t = localStorage.getItem(key);
    if (t) return t;
  }
  return null;
}

function saveToken(token: string) {
  localStorage.setItem('token', token);
  localStorage.removeItem('jwt_token');
}

function clearToken() {
  TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getStoredToken();
    return token ? decodeUser(token) : null;
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const token = getStoredToken();
    if (token) setAuthToken(token);
  }, []);

  const login = async (payload: LoginPayload) => {
    const { token } = await authService.login(payload);
    saveToken(token);
    setAuthToken(token);
    setUser(decodeUser(token));
  };

  const logout = () => {
    clearToken();
    setAuthToken(null);
    setUser(null);
  };

  const loginUser = (token: string) => {
    saveToken(token);
    setAuthToken(token);
    setUser(decodeUser(token));
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, isAdmin, login, logout, loginUser, logoutUser: logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
