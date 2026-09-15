import { apiFetch, API_URL } from './client';
import type { User } from '@/types/file';

export function getGoogleLoginUrl() {
  return `${API_URL}/auth/google`;
}

export function getMe() {
  return apiFetch<{ user: User | null }>('/auth/me');
}

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}
