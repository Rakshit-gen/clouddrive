import { prisma } from '../../config/prisma';
import { ApiError } from '../../lib/apiError';
import { env } from '../../config/env';
import {
  buildObjectKey,
  createGetUrl,
  createPutUrl,
  deleteObject,
  generateFileId,
  headObject,
} from '../../services/s3.service';
import { createUploadToken, verifyUploadToken } from './uploadToken';

const UPLOAD_TOKEN_TTL_MS = 5 * 60 * 1000;

function formatBytesForMessage(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function listFiles(ownerId: string) {
  return prisma.file.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchFiles(ownerId: string, query: string) {
  return prisma.file.findMany({
    where: { ownerId, name: { contains: query, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listSharedWithMe(userId: string) {
  const shares = await prisma.fileShare.findMany({
    where: { sharedWithId: userId },
    include: { file: true, sharedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return shares.map((s) => ({ ...s.file, sharedBy: s.sharedBy }));
}

export async function getStorageUsage(ownerId: string) {
  const { _sum } = await prisma.file.aggregate({
    where: { ownerId },
    _sum: { size: true },
  });
  return {
    used: Number(_sum.size ?? 0),
    limit: env.STORAGE_LIMIT_BYTES,
    maxUploadSize: env.MAX_UPLOAD_SIZE_BYTES,
  };
}

// ponytail: quota check + eventual completeUpload aren't in one transaction, so two
// concurrent uploads can both pass this check and jointly exceed the limit slightly.
// Upgrade to a DB-level constraint or advisory lock if that abuse path matters.
export async function requestUploadUrl(
  ownerId: string,
  input: { filename: string; mimeType: string; size: number },
) {
  const { used, limit } = await getStorageUsage(ownerId);
  if (used + input.size > limit) {
    const remaining = Math.max(0, limit - used);
    throw new ApiError(
      413,
      'STORAGE_LIMIT_EXCEEDED',
      `Not enough storage left. You have ${formatBytesForMessage(remaining)} free out of ${formatBytesForMessage(limit)}.`,
    );
  }

  const fileId = generateFileId();
  const s3Key = buildObjectKey(ownerId, fileId);
  const uploadUrl = await createPutUrl(s3Key, input.mimeType);

  const token = createUploadToken({
    fileId,
    s3Key,
    ownerId,
    originalName: input.filename,
    mimeType: input.mimeType,
    size: input.size,
    exp: Date.now() + UPLOAD_TOKEN_TTL_MS,
  });

  return { fileId, uploadUrl, token };
}

export async function completeUpload(ownerId: string, token: string) {
  const payload = verifyUploadToken(token);

  if (payload.ownerId !== ownerId) {
    throw ApiError.forbidden();
  }

  const existing = await prisma.file.findUnique({ where: { id: payload.fileId } });
  if (existing) {
    return existing;
  }

  const object = await headObject(payload.s3Key);
  if (!object) {
    throw ApiError.badRequest('Upload was not found in storage', 'UPLOAD_NOT_FOUND');
  }

  return prisma.file.create({
    data: {
      id: payload.fileId,
      name: payload.originalName,
      originalName: payload.originalName,
      mimeType: payload.mimeType,
      size: BigInt(object.ContentLength ?? payload.size),
      s3Key: payload.s3Key,
      ownerId,
    },
  });
}

async function getAccessibleFile(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw ApiError.notFound('File not found', 'FILE_NOT_FOUND');
  }

  if (file.ownerId === userId) {
    return file;
  }

  const share = await prisma.fileShare.findUnique({
    where: { fileId_sharedWithId: { fileId, sharedWithId: userId } },
  });
  if (!share) {
    throw ApiError.forbidden();
  }

  return file;
}

async function getOwnedFile(fileId: string, ownerId: string) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw ApiError.notFound('File not found', 'FILE_NOT_FOUND');
  }
  if (file.ownerId !== ownerId) {
    throw ApiError.forbidden();
  }
  return file;
}

export async function getFile(fileId: string, userId: string) {
  return getAccessibleFile(fileId, userId);
}

export async function getDownloadUrl(
  fileId: string,
  userId: string,
  disposition: 'attachment' | 'inline' = 'attachment',
) {
  const file = await getAccessibleFile(fileId, userId);
  const url = await createGetUrl(file.s3Key, file.name, disposition);
  return { url, file };
}

export async function renameFile(fileId: string, ownerId: string, name: string) {
  await getOwnedFile(fileId, ownerId);
  return prisma.file.update({ where: { id: fileId }, data: { name } });
}

export async function deleteFile(fileId: string, ownerId: string) {
  const file = await getOwnedFile(fileId, ownerId);

  await deleteObject(file.s3Key);

  try {
    await prisma.file.delete({ where: { id: fileId } });
  } catch {
    throw new ApiError(
      500,
      'DELETE_INCONSISTENT',
      'The file was removed from storage but its record could not be deleted. Please retry.',
    );
  }
}

export async function shareFile(fileId: string, ownerId: string, targetEmail: string) {
  const file = await getOwnedFile(fileId, ownerId);

  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!targetUser) {
    throw ApiError.notFound('No registered user with that email', 'USER_NOT_FOUND');
  }
  if (targetUser.id === ownerId) {
    throw ApiError.badRequest('You already own this file', 'CANNOT_SHARE_WITH_SELF');
  }

  return prisma.fileShare.upsert({
    where: { fileId_sharedWithId: { fileId, sharedWithId: targetUser.id } },
    update: {},
    create: { fileId: file.id, sharedById: ownerId, sharedWithId: targetUser.id },
  });
}
