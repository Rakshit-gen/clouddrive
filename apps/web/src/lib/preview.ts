export type PreviewKind = 'image' | 'video' | 'audio' | 'pdf' | 'text' | null;

export function getPreviewKind(mimeType: string): PreviewKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/')) return 'text';
  return null;
}
