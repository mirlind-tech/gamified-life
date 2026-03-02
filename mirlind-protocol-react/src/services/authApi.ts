import type { User } from '../contexts/authTypes';
import { enqueueOfflineRequest, replayOfflineQueue, type QueuedRequest } from './offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'auth_token';
const EXPIRED_TOKEN_CODE = 'TOKEN_EXPIRED';
const CONNECTIVITY_ERROR_CODE = 'AUTH_CONNECTIVITY_ERROR';
let refreshPromise: Promise<boolean> | null = null;
let queueReplayPromise: Promise<void> | null = null;

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

export const getApiUrl = (): string => API_URL;

function getFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5173';
}

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('connection refused')
  );
}

export function isAuthConnectivityError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as { code?: string }).code === CONNECTIVITY_ERROR_CODE
  );
}

export function normalizeAuthError(error: unknown): Error {
  if (error instanceof Error && !isNetworkFetchError(error)) {
    return error;
  }

  if (isNetworkFetchError(error)) {
    const frontendOrigin = getFrontendOrigin();
    const connectivityError = new Error(
      `Cannot reach backend at ${API_URL}. Start backend and ensure CORS allows ${frontendOrigin}.`
    ) as Error & { code?: string };
    connectivityError.code = CONNECTIVITY_ERROR_CODE;
    return connectivityError;
  }

  return new Error('Request failed');
}

// Store token in sessionStorage (reduced persistence window)
export const setToken = (token: string) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
};

export const getToken = (): string | null => {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;

  // Migrate legacy localStorage token to sessionStorage
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  if (legacyToken) {
    sessionStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(TOKEN_KEY);
    return legacyToken;
  }

  return null;
};

export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      removeToken();
      return false;
    }

    const data = (await parseJson(response)) as { token?: string };
    if (!data.token) {
      removeToken();
      return false;
    }

    setToken(data.token);
    return true;
  } catch {
    removeToken();
    return false;
  }
};

const ensureRefreshedToken = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const isQueueableMethod = (method: string): boolean => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

const shouldQueueRequest = (endpoint: string, method: string): boolean => {
  if (!isQueueableMethod(method)) return false;
  if (endpoint.startsWith('/auth/')) return false;
  return true;
};

async function executeQueuedRequest(request: QueuedRequest): Promise<boolean> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${request.endpoint}`, {
    method: request.method,
    body: request.body,
    credentials: 'include',
    headers,
  });

  return response.ok;
}

export async function syncOfflineQueue(): Promise<void> {
  if (queueReplayPromise) return queueReplayPromise;

  queueReplayPromise = replayOfflineQueue(executeQueuedRequest).finally(() => {
    queueReplayPromise = null;
  });

  return queueReplayPromise;
}

// API request helper with auth header
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    if (shouldQueueRequest(endpoint, method)) {
      enqueueOfflineRequest({
        endpoint,
        method,
        body: typeof options.body === 'string' ? options.body : undefined,
        timestamp: Date.now(),
      });
      throw new Error('Offline: request queued for sync');
    }
    throw error;
  }

  let data = (await parseJson(response)) as ApiErrorPayload | T;

  if (
    !response.ok &&
    response.status === 403 &&
    endpoint !== '/auth/refresh' &&
    token &&
    (data as ApiErrorPayload).code === EXPIRED_TOKEN_CODE
  ) {
    const refreshed = await ensureRefreshedToken();
    if (refreshed) {
      const retryHeaders: Record<string, string> = {
        ...headers,
      };
      const freshToken = getToken();
      if (freshToken) retryHeaders['Authorization'] = `Bearer ${freshToken}`;

      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers: retryHeaders,
        });
      } catch (error) {
        if (shouldQueueRequest(endpoint, method)) {
          enqueueOfflineRequest({
            endpoint,
            method,
            body: typeof options.body === 'string' ? options.body : undefined,
            timestamp: Date.now(),
          });
          throw new Error('Offline: request queued for sync');
        }
        throw error;
      }
      data = (await parseJson(response)) as ApiErrorPayload | T;
    }
  }

  if (!response.ok) {
    const errorPayload = data as ApiErrorPayload;
    throw new Error(errorPayload.error || 'Request failed');
  }

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    syncOfflineQueue().catch(() => undefined);
  }

  return data as T;
};

// Auth API functions
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(response.token);
    return response;
  } catch (error) {
    throw normalizeAuthError(error);
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(response.token);
    return response;
  } catch (error) {
    throw normalizeAuthError(error);
  }
};

export const logout = () => {
  fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  }).catch(() => undefined);
  removeToken();
};

export const getCurrentUser = async (): Promise<{ user: User }> => {
  return apiRequest('/auth/me');
};

export const initDatabase = async (): Promise<{ message: string }> => {
  return apiRequest('/init-db', { method: 'POST' });
};
