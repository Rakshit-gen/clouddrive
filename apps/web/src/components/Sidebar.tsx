import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { HardDrive, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StorageBar } from '@/components/StorageBar';
import { cn } from '@/lib/utils';

export function Sidebar({ onFilesSelected }: { onFilesSelected: (files: FileList) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 px-3 py-4 sm:flex">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
      <Button
        size="lg"
        className="w-fit gap-2 rounded-2xl px-6 shadow-md"
        onClick={() => inputRef.current?.click()}
      >
        <Plus className="h-5 w-5" />
        New
      </Button>

      <nav className="mt-4 flex flex-col gap-1">
        <NavItem to="/" icon={HardDrive} label="My Drive" end />
        <NavItem to="/shared" icon={Users} label="Shared with me" />
      </nav>

      <StorageBar />
    </aside>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: typeof HardDrive;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent',
          isActive && 'bg-accent text-primary',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
