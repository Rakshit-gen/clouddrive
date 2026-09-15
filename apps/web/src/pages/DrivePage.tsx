import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Topbar } from '@/components/Topbar';
import { Sidebar } from '@/components/Sidebar';
import { UploadProgressPanel } from '@/components/UploadProgressPanel';
import { useUpload } from '@/hooks/useUpload';
import { useStorage } from '@/hooks/useStorage';
import MyDriveView from '@/pages/MyDriveView';
import SharedView from '@/pages/SharedView';

export default function DrivePage() {
  const [search, setSearch] = useState('');
  const { data: storage } = useStorage();
  const { uploads, startUpload } = useUpload(storage?.maxUploadSize);
  const [dragActive, setDragActive] = useState(false);

  function handleFilesSelected(files: FileList) {
    Array.from(files).forEach((file) => startUpload(file));
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background"
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length) handleFilesSelected(e.dataTransfer.files);
      }}
    >
      <Topbar search={search} onSearchChange={setSearch} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar onFilesSelected={handleFilesSelected} />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <Routes>
            <Route path="/" element={<MyDriveView search={search} />} />
            <Route path="/shared" element={<SharedView />} />
          </Routes>
        </main>

        {dragActive && (
          <div className="pointer-events-none absolute inset-0 z-30 m-3 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 animate-in fade-in duration-150">
            <p className="text-lg font-medium text-primary">Drop files to upload</p>
          </div>
        )}
      </div>

      <UploadProgressPanel uploads={uploads} />
    </div>
  );
}
