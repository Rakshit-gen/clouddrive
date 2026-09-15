import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, S3_BUCKET } from '../config/s3';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 60;

export function buildObjectKey(ownerId: string, fileId: string): string {
  return `users/${ownerId}/files/${fileId}`;
}

export async function createPutUrl(key: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

export async function createGetUrl(
  key: string,
  downloadName: string,
  disposition: 'attachment' | 'inline' = 'attachment',
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `${disposition}; filename="${encodeURIComponent(downloadName)}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

export async function headObject(key: string) {
  try {
    return await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export function generateFileId(): string {
  return randomUUID();
}
