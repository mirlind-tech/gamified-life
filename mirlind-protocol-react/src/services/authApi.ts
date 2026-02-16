import type { User } from '../contexts/authTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Store token in localStorage
export const setToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeToken = () => {
  localStorage.removeItem('auth_token');
};

// API request helper with auth header
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
};

// Auth API functions
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setToken(response.token);
  return response;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setToken(response.token);
  return response;
};

export const logout = () => {
  removeToken();
};

export const getCurrentUser = async (): Promise<{ user: User }> => {
  return apiRequest('/auth/me');
};

export const initDatabase = async (): Promise<{ message: string }> => {
  return apiRequest('/init-db', { method: 'POST' });
};
