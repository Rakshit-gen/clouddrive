import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/format';
import { useStorage } from '@/hooks/useStorage';

export function StorageBar() {
  const { data } = useStorage();

  if (!data) return null;

  const pct = data.limit > 0 ? Math.min(100, (data.used / data.limit) * 100) : 0;
  const nearLimit = pct >= 90;

  return (
    <div className="mt-auto px-4 py-3 text-xs text-muted-foreground">
      <Progress
        value={pct}
        className={nearLimit ? '[&>div]:bg-destructive' : undefined}
      />
      <p className="mt-2">
        {formatBytes(data.used)} of {formatBytes(data.limit)} used
      </p>
    </div>
  );
}
