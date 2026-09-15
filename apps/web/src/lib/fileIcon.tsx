import { FileText, FileImage, FileVideo, FileAudio, FileArchive, FileSpreadsheet, File } from 'lucide-react';

export function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return { Icon: FileImage, color: 'text-emerald-400' };
  if (mimeType.startsWith('video/')) return { Icon: FileVideo, color: 'text-purple-400' };
  if (mimeType.startsWith('audio/')) return { Icon: FileAudio, color: 'text-pink-400' };
  if (mimeType === 'application/pdf') return { Icon: FileText, color: 'text-red-400' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv'))
    return { Icon: FileSpreadsheet, color: 'text-green-400' };
  if (mimeType.includes('zip') || mimeType.includes('compressed'))
    return { Icon: FileArchive, color: 'text-yellow-400' };
  if (mimeType.startsWith('text/')) return { Icon: FileText, color: 'text-blue-400' };
  return { Icon: File, color: 'text-slate-400' };
}
