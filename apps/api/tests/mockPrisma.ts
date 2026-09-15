import { randomUUID } from 'node:crypto';

interface MockUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  s3Key: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockShare {
  id: string;
  fileId: string;
  sharedById: string;
  sharedWithId: string;
  createdAt: Date;
}

export const db = {
  users: new Map<string, MockUser>(),
  files: new Map<string, MockFile>(),
  shares: new Map<string, MockShare>(),
};

export function resetMockDb() {
  db.users.clear();
  db.files.clear();
  db.shares.clear();
}

export function seedUser(overrides: Partial<MockUser> = {}): MockUser {
  const now = new Date();
  const user: MockUser = {
    id: randomUUID(),
    googleId: randomUUID(),
    email: `user-${randomUUID()}@example.com`,
    name: 'Test User',
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  db.users.set(user.id, user);
  return user;
}

export const mockPrisma = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) return db.users.get(where.id) ?? null;
      if (where.email) {
        return [...db.users.values()].find((u) => u.email === where.email) ?? null;
      }
      return null;
    },
    upsert: async ({ where, create, update }: any) => {
      const existing = [...db.users.values()].find((u) => u.googleId === where.googleId);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      return seedUser(create);
    },
  },
  file: {
    findMany: async ({ where }: any) => {
      let files = [...db.files.values()];
      if (where?.ownerId) files = files.filter((f) => f.ownerId === where.ownerId);
      if (where?.name?.contains) {
        const q = where.name.contains.toLowerCase();
        files = files.filter((f) => f.name.toLowerCase().includes(q));
      }
      return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    findUnique: async ({ where }: { where: { id: string } }) => db.files.get(where.id) ?? null,
    create: async ({ data }: { data: any }) => {
      const now = new Date();
      const file: MockFile = { ...data, createdAt: now, updatedAt: now };
      db.files.set(file.id, file);
      return file;
    },
    update: async ({ where, data }: any) => {
      const file = db.files.get(where.id);
      if (!file) throw new Error('not found');
      Object.assign(file, data, { updatedAt: new Date() });
      return file;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const file = db.files.get(where.id);
      db.files.delete(where.id);
      return file;
    },
    aggregate: async ({ where }: any) => {
      const files = [...db.files.values()].filter((f) => f.ownerId === where.ownerId);
      const sum = files.reduce((total, f) => total + f.size, 0n);
      return { _sum: { size: sum } };
    },
  },
  fileShare: {
    findUnique: async ({ where }: any) => {
      const [fileId, sharedWithId] = where.fileId_sharedWithId
        ? [where.fileId_sharedWithId.fileId, where.fileId_sharedWithId.sharedWithId]
        : [];
      return (
        [...db.shares.values()].find(
          (s) => s.fileId === fileId && s.sharedWithId === sharedWithId,
        ) ?? null
      );
    },
    upsert: async ({ where, create }: any) => {
      const [fileId, sharedWithId] = [
        where.fileId_sharedWithId.fileId,
        where.fileId_sharedWithId.sharedWithId,
      ];
      const existing = [...db.shares.values()].find(
        (s) => s.fileId === fileId && s.sharedWithId === sharedWithId,
      );
      if (existing) return existing;
      const share: MockShare = { id: randomUUID(), createdAt: new Date(), ...create };
      db.shares.set(share.id, share);
      return share;
    },
    findMany: async ({ where }: any) => {
      return [...db.shares.values()]
        .filter((s) => s.sharedWithId === where.sharedWithId)
        .map((s) => ({
          ...s,
          file: db.files.get(s.fileId),
          sharedBy: db.users.get(s.sharedById),
        }));
    },
  },
};
