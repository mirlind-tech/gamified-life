import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import { AuthView } from './AuthView';

const mockUseAuth = vi.fn();

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../services/authApi', () => ({
  getApiUrl: () => 'http://localhost:3001/api',
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
    button: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseAuthContext = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  error: null as string | null,
  isConnectivityError: false,
  clearError: vi.fn(),
};

describe('AuthView', () => {
  it('shows connectivity help only for connectivity-class auth errors', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthContext,
      error: 'Cannot reach backend at http://localhost:3001/api',
      isConnectivityError: true,
    });

    render(<AuthView />);

    expect(screen.getByText('Connectivity help')).toBeInTheDocument();
    expect(screen.getByText(/ensure backend CORS allows your frontend origin/i)).toBeInTheDocument();
  });

  it('does not show connectivity help for credential errors', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuthContext,
      error: 'Invalid credentials',
      isConnectivityError: false,
    });

    render(<AuthView />);

    expect(screen.queryByText('Connectivity help')).not.toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows runtime API URL hint', () => {
    mockUseAuth.mockReturnValue(baseAuthContext);

    render(<AuthView />);

    expect(screen.getByText(/API endpoint:/)).toBeInTheDocument();
    expect(screen.getByText('http://localhost:3001/api')).toBeInTheDocument();
  });
});
