import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { mockPrisma, resetMockDb, seedUser } from './mockPrisma';

vi.mock('../src/config/prisma', () => ({ prisma: mockPrisma }));
vi.mock('../src/services/s3.service', async () => {
  const actual = await vi.importActual<typeof import('../src/services/s3.service')>(
    '../src/services/s3.service',
  );
  return {
    ...actual,
    createPutUrl: vi.fn(async (key: string) => `https://s3.mock/${key}?put`),
    createGetUrl: vi.fn(async (key: string) => `https://s3.mock/${key}?get`),
    headObject: vi.fn(async () => ({ ContentLength: 1234 })),
    deleteObject: vi.fn(async () => undefined),
  };
});

const { createApp } = await import('../src/app');

async function loginAgent(user: ReturnType<typeof seedUser>) {
  const app = createApp();
  const agent = request.agent(app);
  await agent.post('/test/login').send({ user }).expect(204);
  return agent;
}

async function uploadFile(
  agent: ReturnType<typeof request.agent>,
  filename = 'report.pdf',
) {
  const uploadRes = await agent
    .post('/api/files/upload-url')
    .send({ filename, mimeType: 'application/pdf', size: 1234 })
    .expect(200);

  const completeRes = await agent
    .post('/api/files/complete')
    .send({ token: uploadRes.body.token })
    .expect(201);

  return completeRes.body.file;
}

describe('files API', () => {
  beforeEach(() => {
    resetMockDb();
  });

  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    await request(app).get('/api/files').expect(401);
  });

  it('generates an upload url and completes the upload', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);

    const file = await uploadFile(agent);
    expect(file.name).toBe('report.pdf');
    expect(file.size).toBe(1234);
    expect(file.ownerId).toBe(user.id);
  });

  it('reports storage usage for the current user', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);
    await uploadFile(agent);

    const res = await agent.get('/api/files/storage').expect(200);
    expect(res.body).toEqual({ used: 1234, limit: 3000, maxUploadSize: 15 * 1024 * 1024 });
  });

  it('rejects an upload that would exceed the storage limit', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);
    await uploadFile(agent); // consumes 1234 of the 3000 byte test limit

    const res = await agent
      .post('/api/files/upload-url')
      .send({ filename: 'too-big.pdf', mimeType: 'application/pdf', size: 2000 })
      .expect(413);
    expect(res.body.error.code).toBe('STORAGE_LIMIT_EXCEEDED');
  });

  it('lists only the current user files', async () => {
    const userA = seedUser();
    const agentA = await loginAgent(userA);
    await uploadFile(agentA, 'a.pdf');

    const userB = seedUser();
    const agentB = await loginAgent(userB);
    await uploadFile(agentB, 'b.pdf');

    const res = await agentA.get('/api/files').expect(200);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].name).toBe('a.pdf');
  });

  it('searches files by name for the current user only', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);
    await uploadFile(agent, 'quarterly-report.pdf');
    await uploadFile(agent, 'vacation-photo.png');

    const res = await agent.get('/api/files/search?q=report').expect(200);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].name).toBe('quarterly-report.pdf');
  });

  it('renames a file the user owns', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);
    const file = await uploadFile(agent);

    const res = await agent
      .patch(`/api/files/${file.id}`)
      .send({ name: 'renamed.pdf' })
      .expect(200);
    expect(res.body.file.name).toBe('renamed.pdf');
  });

  it('deletes a file the user owns', async () => {
    const user = seedUser();
    const agent = await loginAgent(user);
    const file = await uploadFile(agent);

    await agent.delete(`/api/files/${file.id}`).expect(204);
    await agent.get(`/api/files/${file.id}`).expect(404);
  });

  describe('cross-user authorization', () => {
    it('returns 403 when another user tries to rename', async () => {
      const owner = seedUser();
      const ownerAgent = await loginAgent(owner);
      const file = await uploadFile(ownerAgent);

      const strangerAgent = await loginAgent(seedUser());
      await strangerAgent
        .patch(`/api/files/${file.id}`)
        .send({ name: 'hijacked.pdf' })
        .expect(403);
    });

    it('returns 403 when another user tries to delete', async () => {
      const owner = seedUser();
      const ownerAgent = await loginAgent(owner);
      const file = await uploadFile(ownerAgent);

      const strangerAgent = await loginAgent(seedUser());
      await strangerAgent.delete(`/api/files/${file.id}`).expect(403);
    });

    it('returns 403 when another user tries to download', async () => {
      const owner = seedUser();
      const ownerAgent = await loginAgent(owner);
      const file = await uploadFile(ownerAgent);

      const strangerAgent = await loginAgent(seedUser());
      await strangerAgent.get(`/api/files/${file.id}/download`).expect(403);
    });

    it('allows a shared user to download but not rename or delete', async () => {
      const owner = seedUser();
      const ownerAgent = await loginAgent(owner);
      const file = await uploadFile(ownerAgent);

      const sharedWith = seedUser();
      await ownerAgent.post(`/api/files/${file.id}/share`).send({ email: sharedWith.email }).expect(201);

      const sharedAgent = await loginAgent(sharedWith);
      await sharedAgent.get(`/api/files/${file.id}/download`).expect(200);
      await sharedAgent.patch(`/api/files/${file.id}`).send({ name: 'x.pdf' }).expect(403);
      await sharedAgent.delete(`/api/files/${file.id}`).expect(403);
    });

    it('rejects sharing with an email that has no registered account', async () => {
      const owner = seedUser();
      const ownerAgent = await loginAgent(owner);
      const file = await uploadFile(ownerAgent);

      const res = await ownerAgent
        .post(`/api/files/${file.id}/share`)
        .send({ email: 'nobody@example.com' })
        .expect(404);

      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
