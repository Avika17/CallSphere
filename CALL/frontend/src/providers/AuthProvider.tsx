'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loginUser, registerUser, addToHistory as apiAddToHistory } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: { name: string; username: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  addMeetingToHistory: (meetingCode: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const router = useRouter();
  const pathname = usePathname();

  // Load auth state from LocalStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('call_token');
    const storedUser = localStorage.getItem('call_user');
    const storedTheme = localStorage.getItem('call_theme') as 'light' | 'dark' || 'dark';

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setTheme(storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginUser(username, password);
      if (data.token) {
        // Since backend doesn't return user name on login, we construct it from username
        const userData = { username, name: username.toUpperCase() };
        localStorage.setItem('call_token', data.token);
        localStorage.setItem('call_user', JSON.stringify(userData));
        setToken(data.token);
        setUser(userData);
        router.push('/dashboard');
      } else {
        throw new Error('No token returned');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, username: string, password: string) => {
    setLoading(true);
    try {
      await registerUser({ name, username, password });
      // After successful registration, we can automatically log the user in
      await login(username, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('call_token');
    localStorage.removeItem('call_user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const addMeetingToHistory = async (meetingCode: string) => {
    if (!token) return;
    try {
      await apiAddToHistory(token, meetingCode);
    } catch (error) {
      console.error('Failed to add meeting to history:', error);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('call_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // Route protection
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/', '/auth'];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/meeting/');

    if (!token && !isPublicRoute) {
      router.push('/auth');
    } else if (token && (pathname === '/' || pathname === '/auth')) {
      router.push('/dashboard');
    }
  }, [token, pathname, loading, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        addMeetingToHistory,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
