import { Inbox, SearchX } from 'lucide-react';

export function EmptyState({ search }: { search: string }) {
  if (search) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No files match "{search}"</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        No files yet. Drag files here or click New to upload.
      </p>
    </div>
  );
}
