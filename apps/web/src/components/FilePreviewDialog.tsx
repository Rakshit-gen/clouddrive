import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPreviewUrl, downloadFile } from '@/api/files';
import { getPreviewKind } from '@/lib/preview';
import { getFileIcon } from '@/lib/fileIcon';
import type { DriveFile } from '@/types/file';

export function FilePreviewDialog({
  file,
  onOpenChange,
}: {
  file: DriveFile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const kind = file ? getPreviewKind(file.mimeType) : null;

  const { data: url, isLoading } = useQuery({
    queryKey: ['preview-url', file?.id],
    queryFn: () => getPreviewUrl(file!.id),
    enabled: !!file,
  });

  const icon = file ? getFileIcon(file.mimeType) : null;

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{file?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] min-h-[200px] items-center justify-center overflow-auto rounded-md bg-secondary">
          {isLoading && <Skeleton className="h-64 w-full" />}

          {!isLoading && url && kind === 'image' && (
            <img src={url} alt={file?.name} className="max-h-[65vh] max-w-full object-contain" />
          )}

          {!isLoading && url && kind === 'video' && (
            <video src={url} controls className="max-h-[65vh] max-w-full" />
          )}

          {!isLoading && url && kind === 'audio' && (
            <audio src={url} controls className="w-full px-6" />
          )}

          {!isLoading && url && (kind === 'pdf' || kind === 'text') && (
            <iframe src={url} title={file?.name} className="h-[65vh] w-full rounded-md" />
          )}

          {!isLoading && !kind && icon && file && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <icon.Icon className={`h-16 w-16 ${icon.color}`} />
              <p className="text-sm text-muted-foreground">
                No preview available for this file type.
              </p>
              <Button onClick={() => downloadFile(file.id)}>Download</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
