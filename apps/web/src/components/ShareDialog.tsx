import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useShareFile } from '@/hooks/useFiles';
import type { DriveFile } from '@/types/file';

export function ShareDialog({
  file,
  onOpenChange,
}: {
  file: DriveFile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const share = useShareFile();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !email.trim() || share.isPending) return;

    share.mutate(
      { id: file.id, email: email.trim() },
      {
        onSuccess: () => {
          toast.success(`Shared with ${email.trim()}`);
          setEmail('');
          setError('');
          onOpenChange(false);
        },
        onError: (err: Error) => setError(err.message),
      },
    );
  }

  return (
    <Dialog
      open={!!file}
      onOpenChange={(open) => {
        if (!open) {
          setEmail('');
          setError('');
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{file?.name}"</DialogTitle>
          <DialogDescription>
            They'll be able to view and download this file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter an email address"
            aria-invalid={!!error}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim() || share.isPending}>
              {share.isPending ? 'Sharing...' : 'Share'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
