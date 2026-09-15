import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRenameFile } from '@/hooks/useFiles';
import type { DriveFile } from '@/types/file';

export function RenameDialog({
  file,
  onOpenChange,
}: {
  file: DriveFile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const rename = useRenameFile();

  useEffect(() => {
    if (file) setName(file.name);
  }, [file]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim() || rename.isPending) return;

    rename.mutate(
      { id: file.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success('File renamed');
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            onFocus={(e) => e.currentTarget.select()}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || rename.isPending}>
              {rename.isPending ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
