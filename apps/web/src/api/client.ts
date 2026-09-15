import { toast } from 'sonner';
import { queryClient } from '@/lib/queryClient';

// ponytail: production builds default to a relative API base since vercel.json proxies
// /api and /auth to the Render backend (same-origin, so the session cookie actually sticks
// on iOS/Safari). Only dev mode needs the localhost:4000 fallback; VITE_API_URL still
// overrides both if a deployment ever needs to point elsewhere.
export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000');

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message ?? 'Something went wrong. Please try again.';
    const code = data?.error?.code ?? 'UNKNOWN_ERROR';

    // ponytail: /auth/me legitimately 401s for a logged-out visitor — only treat this as a
    // "your session just expired" event for every other endpoint, and only announce it once.
    if (res.status === 401 && path !== '/auth/me') {
      const cached = queryClient.getQueryData<{ user: unknown }>(['me']);
      if (cached?.user) {
        toast.error('Session expired', { description: 'Please sign in again.' });
      }
      queryClient.setQueryData(['me'], { user: null });
    }

    throw new ApiRequestError(res.status, code, message);
  }

  return data as T;
}
