import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../shared/function-options';

export const uploadProfessionalDraftLogo = onCall({ ...callableFunctionOptions }, async request => {
  const ownerUid = request.auth?.uid;
  if (!ownerUid) throw new HttpsError('unauthenticated','Sign in to upload your logo.');
  const { content, contentType } = request.data as { content?: unknown; contentType?: unknown };
  if (typeof content !== 'string' || content.length > 3_000_000 ||
      !['image/png','image/jpeg','image/webp'].includes(String(contentType))) {
    throw new HttpsError('invalid-argument','Logo must be a PNG, JPEG or WebP image under 2 MB.');
  }
  const buffer = Buffer.from(content, 'base64');
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) {
    throw new HttpsError('invalid-argument','Logo exceeds the 2 MB limit.');
  }
  const mime = String(contentType);
  const valid = mime === 'image/png' ? buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
    mime === 'image/jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 :
    buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
  if (!valid) throw new HttpsError('invalid-argument','Invalid logo file format.');
  const bucket = getStorage().bucket();
  const token = randomUUID();
  const path = `professional-draft-logos/${ownerUid}/${randomUUID()}`;
  await bucket.file(path).save(buffer, {
    resumable: false,
    metadata: { contentType: mime, metadata: { firebaseStorageDownloadTokens: token, ownerUid } }
  });
  const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { logoUrl };
});
