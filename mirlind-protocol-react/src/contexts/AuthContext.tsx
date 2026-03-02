import { useState, useEffect, type ReactNode } from 'react';
import * as authApi from '../services/authApi';
import { AuthContext, type User } from './authTypes';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnectivityError, setIsConnectivityError] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authApi.getToken();
      if (token) {
        try {
          const { user } = await authApi.getCurrentUser();
          setUser(user);
        } catch {
          // Token invalid, clear it
          authApi.removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsConnectivityError(false);
      setIsLoading(true);
      const { user } = await authApi.login({ email, password });
      setUser(user);
    } catch (err) {
      const normalized = authApi.normalizeAuthError(err);
      setError(normalized.message);
      setIsConnectivityError(authApi.isAuthConnectivityError(normalized));
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      setIsConnectivityError(false);
      setIsLoading(true);
      const { user } = await authApi.register({ email, password, username });
      setUser(user);
    } catch (err) {
      const normalized = authApi.normalizeAuthError(err);
      setError(normalized.message);
      setIsConnectivityError(authApi.isAuthConnectivityError(normalized));
      throw normalized;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const clearError = () => {
    setError(null);
    setIsConnectivityError(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
        isConnectivityError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
