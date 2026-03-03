'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005';

// Always use mock mode for Vercel preview (no backend needed)
const isMockMode = true;

export interface AuthState {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Server Action for user login
 * Uses React 19's useActionState pattern
 */
export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  // Mock mode: skip API call, just set cookies
  if (isMockMode) {
    const mockToken = 'mock-token-' + Date.now();
    
    (await cookies()).set('token', mockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    (await cookies()).set('access_token', mockToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true, message: 'Login successful' };
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Login failed' };
    }

    const data = await response.json();
    
    (await cookies()).set('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    (await cookies()).set('access_token', data.token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true, message: 'Login successful' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Server Action for user registration
 */
export async function registerAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !username || !password) {
    return { success: false, error: 'All fields are required' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Mock mode: skip API call
  if (isMockMode) {
    const mockToken = 'mock-token-' + Date.now();
    
    (await cookies()).set('token', mockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    (await cookies()).set('access_token', mockToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true, message: 'Registration successful' };
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Registration failed' };
    }

    const data = await response.json();
    
    (await cookies()).set('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    (await cookies()).set('access_token', data.token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true, message: 'Registration successful' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

/**
 * Server Action for logout
 */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete('token');
  (await cookies()).delete('access_token');
  redirect('/');
}

/**
 * Get current token from cookies
 */
export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get('token')?.value;
}
