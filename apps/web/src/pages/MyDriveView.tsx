import { useState } from 'react';
import { toast } from 'sonner';
import { FileGrid } from '@/components/FileGrid';
import { RenameDialog } from '@/components/RenameDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { FilePreviewDialog } from '@/components/FilePreviewDialog';
import { useFileList } from '@/hooks/useFiles';
import { downloadFile } from '@/api/files';
import type { DriveFile } from '@/types/file';

export default function MyDriveView({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useFileList(search);
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [shareTarget, setShareTarget] = useState<DriveFile | null>(null);
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
      <h1 className="px-4 pt-4 text-xl font-normal">My Drive</h1>
      <FileGrid
        files={data?.files}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        search={search}
        onRename={setRenameTarget}
        onDelete={setDeleteTarget}
        onShare={setShareTarget}
        onDownload={handleDownload}
        onPreview={setPreviewTarget}
      />

      <RenameDialog file={renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)} />
      <DeleteConfirmDialog
        file={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
      <ShareDialog file={shareTarget} onOpenChange={(open) => !open && setShareTarget(null)} />
      <FilePreviewDialog
        file={previewTarget}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
      />
    </>
  );
}
