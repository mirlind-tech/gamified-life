"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types/auth";
import { api } from "@/lib/api";
import { getToken, logoutAction } from "@/app/actions/auth";

const MOCK_USER: User = {
  id: "demo-user",
  email: "demo@mirlind.io",
  username: "DemoUser",
  level: 12,
  xp: 2840,
  created_at: new Date().toISOString(),
};

// Always use mock mode for Vercel preview (no backend needed)
const isMockMode = true;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  register: (_email: string, _username: string, _password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // Mock mode: always logged in
    if (isMockMode) {
      setUser(MOCK_USER);
      return;
    }

    try {
      const token = await getToken();
      const localToken = typeof window !== 'undefined' 
        ? localStorage.getItem("access_token") 
        : null;
      
      if (token || localToken) {
        const { user: userData } = await api.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    if (isMockMode) {
      setUser(MOCK_USER);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, _password: string) => {
    if (isMockMode) {
      setUser({ ...MOCK_USER, email, username });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.register({ email, username, password: _password });
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isMockMode) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    try {
      await logoutAction();
      if (typeof window !== 'undefined') {
        localStorage.removeItem("access_token");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
