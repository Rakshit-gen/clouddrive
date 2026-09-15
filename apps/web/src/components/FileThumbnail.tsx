import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPreviewUrl } from '@/api/files';
import { getPreviewKind } from '@/lib/preview';
import { getFileIcon } from '@/lib/fileIcon';
import { useInView } from '@/hooks/useInView';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DriveFile } from '@/types/file';

function PdfPageCanvas({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { renderPdfFirstPage } = await import('@/lib/pdfPreview');
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        await renderPdfFirstPage(url, canvas, 220);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) return null;
  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full object-cover animate-in fade-in duration-300"
    />
  );
}

export function FileThumbnail({ file, className }: { file: DriveFile; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const kind = getPreviewKind(file.mimeType);
  const { Icon, color } = getFileIcon(file.mimeType);
  const previewable = kind === 'image' || kind === 'pdf';

  const { data: url, isLoading } = useQuery({
    queryKey: ['preview-url', file.id],
    queryFn: () => getPreviewUrl(file.id),
    enabled: inView && previewable,
    staleTime: 5 * 60 * 1000,
  });

  const showLoadingSkeleton = previewable && inView && isLoading && !url;

  return (
    <div ref={ref} className={cn('flex h-full w-full items-center justify-center', className)}>
      {url && kind === 'image' && (
        <img
          src={url}
          alt={file.name}
          className="h-full w-full object-cover animate-in fade-in duration-300"
          loading="lazy"
        />
      )}
      {url && kind === 'pdf' && <PdfPageCanvas url={url} />}
      {showLoadingSkeleton && <Skeleton className="h-full w-full rounded-none" />}
      {!showLoadingSkeleton && (!url || !previewable) && (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
          <Icon className={`h-10 w-10 ${color}`} />
        </div>
      )}
    </div>
  );
}
