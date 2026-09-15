import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { ApiError } from '../../lib/apiError';

export interface UploadTokenPayload {
  fileId: string;
  s3Key: string;
  ownerId: string;
  originalName: string;
  mimeType: string;
  size: number;
  exp: number;
}

function sign(data: string): string {
  return createHmac('sha256', env.UPLOAD_TOKEN_SECRET).update(data).digest('base64url');
}

export function createUploadToken(payload: UploadTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyUploadToken(token: string): UploadTokenPayload {
  const [body, signature] = token.split('.');
  if (!body || !signature) {
    throw ApiError.badRequest('Invalid upload token', 'INVALID_UPLOAD_TOKEN');
  }

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw ApiError.badRequest('Invalid upload token', 'INVALID_UPLOAD_TOKEN');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as UploadTokenPayload;
  if (Date.now() > payload.exp) {
    throw ApiError.badRequest('Upload token expired', 'UPLOAD_TOKEN_EXPIRED');
  }

  return payload;
}
