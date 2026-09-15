import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteFile } from '@/hooks/useFiles';
import type { DriveFile } from '@/types/file';

export function DeleteConfirmDialog({
  file,
  onOpenChange,
}: {
  file: DriveFile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const del = useDeleteFile();

  function handleDelete() {
    if (!file) return;
    del.mutate(file.id, {
      onSuccess: () => {
        toast.success('File deleted');
        onOpenChange(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  }

  return (
    <AlertDialog open={!!file} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Move to trash?</AlertDialogTitle>
          <AlertDialogDescription>
            "{file?.name}" will be permanently deleted. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={del.isPending}>
            {del.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
