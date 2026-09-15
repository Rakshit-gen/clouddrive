import { apiFetch } from './client';

export interface StorageUsage {
  used: number;
  limit: number;
  maxUploadSize: number;
}

export function getStorageUsage() {
  return apiFetch<StorageUsage>('/api/files/storage');
}
