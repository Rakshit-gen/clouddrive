import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FileCard } from '@/components/FileCard';
import type { DriveFile } from '@/types/file';

export function FileGrid({
  files,
  isLoading,
  isError,
  onRetry,
  search,
  readOnly,
  onRename,
  onDelete,
  onShare,
  onDownload,
  onPreview,
}: {
  files: DriveFile[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  search: string;
  readOnly?: boolean;
  onRename: (file: DriveFile) => void;
  onDelete: (file: DriveFile) => void;
  onShare: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void;
  onPreview: (file: DriveFile) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Couldn't load your files. Check your connection and retry." onRetry={onRetry} />;
  }

  if (!files || files.length === 0) {
    return <EmptyState search={search} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          readOnly={readOnly}
          onRename={() => onRename(file)}
          onDelete={() => onDelete(file)}
          onShare={() => onShare(file)}
          onDownload={() => onDownload(file)}
          onPreview={() => onPreview(file)}
        />
      ))}
    </div>
  );
}
