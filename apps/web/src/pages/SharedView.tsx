import { useState } from 'react';
import { toast } from 'sonner';
import { FileGrid } from '@/components/FileGrid';
import { FilePreviewDialog } from '@/components/FilePreviewDialog';
import { useSharedFiles } from '@/hooks/useFiles';
import { downloadFile } from '@/api/files';
import type { DriveFile } from '@/types/file';

export default function SharedView() {
  const { data, isLoading, isError, refetch } = useSharedFiles();
  const [previewTarget, setPreviewTarget] = useState<DriveFile | null>(null);

  async function handleDownload(file: DriveFile) {
    try {
      await downloadFile(file.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <h1 className="px-4 pt-4 text-xl font-normal">Shared with me</h1>
      <FileGrid
        files={data?.files}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        search=""
        readOnly
        onRename={() => {}}
        onDelete={() => {}}
        onShare={() => {}}
        onDownload={handleDownload}
        onPreview={setPreviewTarget}
      />
      <FilePreviewDialog
        file={previewTarget}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
      />
    </>
  );
}
