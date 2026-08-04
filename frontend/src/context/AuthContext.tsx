import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  availableUsers: User[];
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('support_ticket_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('support_ticket_user');
      }
    }
    setLoading(false);
    refreshUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const response = await api.get<User[]>('/users');
      setAvailableUsers(response.data);
    } catch (e) {
      console.error('Failed to fetch available users:', e);
    }
  };

  const login = async (userId: number) => {
    setLoading(true);
    try {
      const response = await api.post<User>('/login', { userId });
      setUser(response.data);
      localStorage.setItem('support_ticket_user', JSON.stringify(response.data));
    } catch (e) {
      console.error('Login failed:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('support_ticket_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, availableUsers, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
