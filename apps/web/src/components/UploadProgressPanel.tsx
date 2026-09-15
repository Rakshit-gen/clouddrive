import { CheckCircle2, File as FileIcon, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { UploadItem } from '@/hooks/useUpload';

export function UploadProgressPanel({ uploads }: { uploads: UploadItem[] }) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="border-b border-border px-4 py-2 text-sm font-medium">
        Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-right-2 duration-200"
          >
            {upload.status === 'done' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 animate-in zoom-in duration-200" />
            ) : upload.status === 'error' ? (
              <XCircle className="h-5 w-5 shrink-0 text-destructive animate-in zoom-in duration-200" />
            ) : (
              <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{upload.name}</p>
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="mt-1.5" />
              )}
              {upload.status === 'error' && (
                <p className="mt-0.5 truncate text-xs text-destructive">{upload.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
