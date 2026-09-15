export interface DriveFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  sharedBy?: { name: string; email: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}
