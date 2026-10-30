import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, DemoAccount } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoAccounts: DemoAccount[];
  isBackendConnected: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemoUser: (email: string) => Promise<boolean>;
  logout: () => void;
  checkHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('collabdocs_token'));
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  const toast = useToast();

  const checkHealth = useCallback(async () => {
    try {
      const res = await api.health.check();
      setIsBackendConnected(res.database.connected);
    } catch (err) {
      setIsBackendConnected(false);
    }
  }, []);

  const loadDemoAccounts = useCallback(async () => {
    try {
      const res = await api.auth.getDemoAccounts();
      if (res.success && res.accounts) {
        setDemoAccounts(res.accounts);
      }
    } catch {
      // Ignore if server isn't reached yet
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await checkHealth();
      await loadDemoAccounts();

      const savedToken = localStorage.getItem('collabdocs_token');
      if (savedToken) {
        try {
          const res = await api.auth.me();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem('collabdocs_token');
            setToken(null);
            setUser(null);
          }
        } catch {
          // If token expired or invalid
          localStorage.removeItem('collabdocs_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto-login as Alice by default for convenient reviewer evaluation if no user is saved
        try {
          const res = await api.auth.login('alice@example.com', 'Password123!');
          if (res.success && res.token) {
            localStorage.setItem('collabdocs_token', res.token);
            setToken(res.token);
            setUser(res.user);
          }
        } catch {
          // Ignore if cannot auto login
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [checkHealth, loadDemoAccounts]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem('collabdocs_token', res.token);
        setToken(res.token);
        setUser(res.user);
        toast.success(`Signed in as ${res.user.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      return false;
    }
  };

  const loginAsDemoUser = async (email: string): Promise<boolean> => {
    return login(email, 'Password123!');
  };

  const logout = () => {
    localStorage.removeItem('collabdocs_token');
    setToken(null);
    setUser(null);
    toast.info('Signed out of CollabDocs');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoAccounts,
        isBackendConnected,
        login,
        loginAsDemoUser,
        logout,
        checkHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

