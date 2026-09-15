import { z } from 'zod';
import { env } from '../../config/env';

const SAFE_FILENAME_RE = /^[^/\\\0]+$/;

export const filenameSchema = z
  .string()
  .trim()
  .min(1, 'Filename is required')
  .max(255, 'Filename must be 255 characters or fewer')
  .refine((name) => SAFE_FILENAME_RE.test(name), 'Filename contains invalid characters')
  .refine((name) => name !== '.' && name !== '..', 'Filename is invalid')
  // eslint-disable-next-line no-control-regex
  .refine((name) => !/[\x00-\x1f]/.test(name), 'Filename contains invalid characters');

export const mimeTypeSchema = z
  .string()
  .trim()
  .min(1, 'MIME type is required')
  .max(255)
  .regex(/^[\w.+-]+\/[\w.+-]+$/, 'Invalid MIME type');

export const uuidSchema = z.string().uuid('Invalid identifier');

export const createUploadUrlSchema = z.object({
  filename: filenameSchema,
  mimeType: mimeTypeSchema,
  size: z
    .number()
    .int()
    .positive('File size must be greater than 0')
    .max(env.MAX_UPLOAD_SIZE_BYTES, `File exceeds the maximum upload size`),
});

export const completeUploadSchema = z.object({
  token: z.string().min(1, 'Upload token is required'),
});

export const renameFileSchema = z.object({
  name: filenameSchema,
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(255),
});

export const shareFileSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
});

export const downloadQuerySchema = z.object({
  disposition: z.enum(['attachment', 'inline']).default('attachment'),
});
