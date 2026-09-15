import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadFile } from '@/api/files';
import { formatBytes } from '@/lib/format';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const FALLBACK_MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

export function useUpload(maxUploadSize = FALLBACK_MAX_UPLOAD_SIZE) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const queryClient = useQueryClient();

  const startUpload = useCallback(
    (file: File) => {
      if (file.size > maxUploadSize) {
        toast.error(`${file.name} is too large`, {
          description: `Files can be up to ${formatBytes(maxUploadSize)}. This file is ${formatBytes(file.size)}.`,
        });
        return;
      }

      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((prev) => [...prev, { id, name: file.name, progress: 0, status: 'uploading' }]);

      uploadFile(file, (pct) => {
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
      })
        .then(() => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: 100, status: 'done' } : u)),
          );
          queryClient.invalidateQueries({ queryKey: ['files'] });
          queryClient.invalidateQueries({ queryKey: ['storage'] });
          setTimeout(() => {
            setUploads((prev) => prev.filter((u) => u.id !== id));
          }, 2000);
        })
        .catch((err: Error) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u)),
          );
          toast.error(`Couldn't upload ${file.name}`, { description: err.message });
        });
    },
    [queryClient, maxUploadSize],
  );

  return { uploads, startUpload };
}
