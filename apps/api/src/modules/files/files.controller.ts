import { Request, Response } from 'express';
import { File } from '@prisma/client';
import { asyncHandler } from '../../lib/asyncHandler';
import {
  completeUploadSchema,
  createUploadUrlSchema,
  downloadQuerySchema,
  renameFileSchema,
  searchQuerySchema,
  shareFileSchema,
  uuidSchema,
} from './files.validation';
import * as filesService from './files.service';

function serializeFile(file: File) {
  return {
    id: file.id,
    name: file.name,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: Number(file.size),
    ownerId: file.ownerId,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

function currentUserId(req: Request): string {
  return req.user!.id;
}

export const list = asyncHandler(async (req, res) => {
  const files = await filesService.listFiles(currentUserId(req));
  res.json({ files: files.map(serializeFile) });
});

export const search = asyncHandler(async (req, res) => {
  const { q } = searchQuerySchema.parse(req.query);
  const files = await filesService.searchFiles(currentUserId(req), q);
  res.json({ files: files.map(serializeFile) });
});

export const sharedWithMe = asyncHandler(async (req, res) => {
  const files = await filesService.listSharedWithMe(currentUserId(req));
  res.json({ files: files.map((f) => ({ ...serializeFile(f), sharedBy: f.sharedBy })) });
});

export const storageUsage = asyncHandler(async (req, res) => {
  const usage = await filesService.getStorageUsage(currentUserId(req));
  res.json(usage);
});

export const createUploadUrl = asyncHandler(async (req, res) => {
  const input = createUploadUrlSchema.parse(req.body);
  const result = await filesService.requestUploadUrl(currentUserId(req), input);
  res.json(result);
});

export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
  const { token } = completeUploadSchema.parse(req.body);
  const file = await filesService.completeUpload(currentUserId(req), token);
  res.status(201).json({ file: serializeFile(file) });
});

export const getById = asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const file = await filesService.getFile(id, currentUserId(req));
  res.json({ file: serializeFile(file) });
});

export const download = asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const { disposition } = downloadQuerySchema.parse(req.query);
  const { url } = await filesService.getDownloadUrl(id, currentUserId(req), disposition);
  res.json({ url });
});

export const rename = asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const { name } = renameFileSchema.parse(req.body);
  const file = await filesService.renameFile(id, currentUserId(req), name);
  res.json({ file: serializeFile(file) });
});

export const remove = asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  await filesService.deleteFile(id, currentUserId(req));
  res.status(204).send();
});

export const share = asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const { email } = shareFileSchema.parse(req.body);
  await filesService.shareFile(id, currentUserId(req), email.toLowerCase());
  res.status(201).json({ success: true });
});
