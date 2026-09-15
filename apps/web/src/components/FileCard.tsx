import { useState } from 'react';
import { Download, Eye, MoreVertical, Pencil, Share2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FileThumbnail } from '@/components/FileThumbnail';
import { getFileIcon } from '@/lib/fileIcon';
import { formatBytes, formatDate } from '@/lib/format';
import type { DriveFile } from '@/types/file';

export function FileCard({
  file,
  readOnly,
  onRename,
  onDelete,
  onShare,
  onDownload,
  onPreview,
}: {
  file: DriveFile;
  readOnly?: boolean;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
  onDownload: () => void;
  onPreview: () => void;
}) {
  const { Icon, color } = getFileIcon(file.mimeType);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-150 hover:-translate-y-0.5 hover:border-muted-foreground/40 hover:shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
        <span className="flex-1 truncate text-sm font-medium" title={file.name}>
          {file.name}
        </span>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
              aria-label="File actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </DropdownMenuItem>
            {!readOnly && (
              <>
                <DropdownMenuItem onClick={onRename} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} destructive className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Move to trash
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button
        onClick={onPreview}
        className="relative aspect-[4/3] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`Preview ${file.name}`}
      >
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-muted/50 to-muted/20">
          <FileThumbnail file={file} />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-150 group-hover:bg-black/30 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
          <span>{formatDate(file.createdAt)}</span>
          <span className="text-white/50">&middot;</span>
          <span className="tabular-nums">{formatBytes(file.size)}</span>
        </div>
      </button>
    </div>
  );
}
