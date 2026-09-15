import { apiFetch } from './client';
import type { DriveFile } from '@/types/file';

export function listFiles() {
  return apiFetch<{ files: DriveFile[] }>('/api/files');
}

export function listShared() {
  return apiFetch<{ files: DriveFile[] }>('/api/files/shared');
}

export function searchFiles(query: string) {
  return apiFetch<{ files: DriveFile[] }>(`/api/files/search?q=${encodeURIComponent(query)}`);
}

export function requestUploadUrl(input: { filename: string; mimeType: string; size: number }) {
  return apiFetch<{ fileId: string; uploadUrl: string; token: string }>('/api/files/upload-url', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function putToS3(uploadUrl: string, file: File, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error('Upload to storage failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload to storage failed'));
    xhr.send(file);
  });
}

export function completeUpload(token: string) {
  return apiFetch<{ file: DriveFile }>('/api/files/complete', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function uploadFile(file: File, onProgress?: (pct: number) => void) {
  const { uploadUrl, token } = await requestUploadUrl({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  });
  await putToS3(uploadUrl, file, onProgress);
  const { file: created } = await completeUpload(token);
  return created;
}

export async function downloadFile(id: string) {
  const { url } = await apiFetch<{ url: string }>(`/api/files/${id}/download`);
  window.location.href = url;
}

export async function getPreviewUrl(id: string) {
  const { url } = await apiFetch<{ url: string }>(
    `/api/files/${id}/download?disposition=inline`,
  );
  return url;
}

export function renameFile(id: string, name: string) {
  return apiFetch<{ file: DriveFile }>(`/api/files/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export function deleteFile(id: string) {
  return apiFetch<void>(`/api/files/${id}`, { method: 'DELETE' });
}

export function shareFile(id: string, email: string) {
  return apiFetch<{ success: true }>(`/api/files/${id}/share`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
