/**
 * media-upload.ts
 *
 * Uploads a local device URI (photo/video from ImagePicker) to the backend
 * MinIO storage via the document-uploader endpoint and returns the public
 * preview URL that can be stored and displayed by any client.
 *
 * Usage:
 *   const url = await uploadMediaToServer(uri, token, tenantId, 'image/jpeg');
 */

import { File, UploadType } from 'expo-file-system';

import { publicEnv } from '@/lib/config/public-env';

/**
 * Returns a displayable preview URL for a MinIO storage key.
 * Works the same way as profilePhotoUri() in profile-api.ts.
 */
export function mediaPreviewUrl(key: string, isVideo: boolean = false): string {
  const extra = isVideo ? "&type=video&ext=.mp4" : "";
  return `${publicEnv.apiUrl}/document-uploader/preview?key=${encodeURIComponent(key)}${extra}`;
}

/**
 * Uploads a single local URI to the backend document-uploader endpoint.
 * Returns the permanent preview URL (served via MinIO) on success.
 *
 * @param uri       - local file URI from expo-image-picker (e.g. file:///...)
 * @param token     - JWT bearer token
 * @param tenantId  - X-Tenant-Id header value
 * @param mimeType  - MIME type of the file (default: image/jpeg)
 * @param entityType - entity type for document record (default: 'post')
 * @param entityId   - entity id for document record (default: 'media')
 */
export async function uploadMediaToServer(
  uri: string,
  token: string,
  tenantId: string,
  mimeType: string = 'image/jpeg',
  entityType: string = 'post',
  entityId: string = 'media',
): Promise<string> {
  const url =
    `${publicEnv.apiUrl}/document-uploader` +
    `?entityType=${encodeURIComponent(entityType)}` +
    `&entityId=${encodeURIComponent(entityId)}` +
    `&refType=media` +
    `&refId=1`;

  const result = await new File(uri).upload(url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
  });

  let payload: { success?: boolean; message?: string | string[]; data?: { key?: string; url?: string; documentId?: string } } = {};
  try {
    payload = JSON.parse(result.body) as typeof payload;
  } catch {
    throw new Error('Media upload failed: invalid server response');
  }

  if (result.status >= 400 || payload.success === false || !payload.data) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message;
    throw new Error(message || 'Media upload failed');
  }

  const key = payload.data.key || payload.data.url;
  if (!key) {
    throw new Error('Media upload failed: no storage key returned');
  }

  const isVideo = (mimeType && mimeType.startsWith('video/')) || /\.(mp4|mov|m4v|webm)$/i.test(uri);
  return mediaPreviewUrl(key, isVideo);
}

/**
 * Uploads multiple local URIs in sequence. Returns an array of preview URLs.
 * Failures for individual files are logged but do not abort the entire batch.
 */
export async function uploadMediaBatch(
  uris: string[],
  token: string,
  tenantId: string,
  entityType: string = 'post',
  entityId: string = 'media',
): Promise<string[]> {
  const results: string[] = [];
  for (const uri of uris) {
    try {
      const mimeType = /\.(mp4|mov|m4v|webm)$/i.test(uri) ? 'video/mp4' : 'image/jpeg';
      const url = await uploadMediaToServer(uri, token, tenantId, mimeType, entityType, entityId);
      results.push(url);
    } catch (err) {
      console.error('[media-upload] Failed to upload', uri, err);
    }
  }
  return results;
}
