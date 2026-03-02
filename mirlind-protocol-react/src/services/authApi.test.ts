import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('authApi error handling', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('maps fetch network failures to connectivity guidance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const authApi = await import('./authApi');

    let thrown: unknown;
    try {
      await authApi.login({ email: 'user@example.com', password: 'password123' });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(authApi.isAuthConnectivityError(thrown)).toBe(true);
    expect((thrown as Error).message).toContain('Cannot reach backend at http://localhost:3001/api');
  });

  it('preserves backend auth errors for invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const authApi = await import('./authApi');

    await expect(
      authApi.login({ email: 'user@example.com', password: 'wrong-password' })
    ).rejects.toThrow('Invalid credentials');
  });

  it('falls back to a safe message for non-JSON backend failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('internal error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      )
    );
    const authApi = await import('./authApi');

    await expect(
      authApi.login({ email: 'user@example.com', password: 'password123' })
    ).rejects.toThrow('Request failed');
  });
});
