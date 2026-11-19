import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { publicEnv } from '@/lib/config/public-env';

import { DIRECTORY_TEMPLATE_XLSX_BASE64 } from './directory-template.base64';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportBatchResult {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

/** Column headers shown in the UI (template itself is empty Excel like CDRMS). */
export const DIRECTORY_TEMPLATE_HEADERS =
  'usn,fullName,collegeEmail,password,department,batch,program,hostelite,role,mobile';

export const DIRECTORY_EXCEL_TEMPLATE_FILENAME = 'campus-directory-template.xlsx';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function triggerWebBlobDownload(base64: string, filename: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: XLSX_MIME });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

/**
 * Same proven path as CDRMS: write base64 → share .xlsx.
 * Do NOT use the new File.write(Uint8Array) for Excel — it corrupts the zip on Android.
 */
async function writeAndShareXlsxBase64(base64: string, filename: string, dialogTitle: string) {
  const root = FileSystem.cacheDirectory;
  if (!root) {
    throw new Error('Device storage is not available.');
  }

  const dest = `${root}${filename}`;
  await FileSystem.deleteAsync(dest, { idempotent: true });
  await FileSystem.writeAsStringAsync(dest, base64.replace(/\s+/g, ''), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists || !('size' in info) || !info.size || info.size < 100) {
    throw new Error('Template file was not written correctly.');
  }

  // Quick integrity check — xlsx must start with PK (ZIP)
  const head = await FileSystem.readAsStringAsync(dest, {
    encoding: FileSystem.EncodingType.Base64,
    length: 8,
    position: 0,
  });
  const decodedHead = globalThis.atob(head);
  if (!decodedHead.startsWith('PK')) {
    throw new Error('Template file is corrupted. Please try Download Template again.');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available. Open the file from Files / Downloads.');
  }

  await Sharing.shareAsync(dest, {
    mimeType: XLSX_MIME,
    dialogTitle,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
  });
}

async function fetchRemoteTemplateBase64(token?: string, tenantId?: string): Promise<string | null> {
  if (!token || token.startsWith('mock-') || !FileSystem.cacheDirectory) {
    return null;
  }

  try {
    const tempPath = `${FileSystem.cacheDirectory}campus-directory-template-remote.xlsx`;
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
    const result = await FileSystem.downloadAsync(
      `${publicEnv.apiUrl}/users/import/template`,
      tempPath,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: XLSX_MIME,
          'X-Tenant-Id': tenantId || publicEnv.tenantId || 'nmit',
        },
      },
    );

    if (result.status < 200 || result.status >= 300) {
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
      return null;
    }

    const head = await FileSystem.readAsStringAsync(tempPath, {
      encoding: FileSystem.EncodingType.Base64,
      length: 8,
      position: 0,
    });
    if (!globalThis.atob(head).startsWith('PK')) {
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
      return null;
    }

    const b64 = await FileSystem.readAsStringAsync(tempPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
    return b64;
  } catch {
    return null;
  }
}

/**
 * CDRMS-style: download Excel template (yellow headers, empty rows), fill manually, then upload.
 */
export async function downloadDirectoryCsvTemplateApi(
  token?: string,
  tenantId?: string,
): Promise<void> {
  const remote = await fetchRemoteTemplateBase64(token, tenantId);
  const base64 = (remote || DIRECTORY_TEMPLATE_XLSX_BASE64).replace(/\s+/g, '');

  if (Platform.OS === 'web') {
    triggerWebBlobDownload(base64, DIRECTORY_EXCEL_TEMPLATE_FILENAME);
    return;
  }

  await writeAndShareXlsxBase64(
    base64,
    DIRECTORY_EXCEL_TEMPLATE_FILENAME,
    'Campus directory template',
  );
}

/**
 * Copy picker URI into app cache so upload has a readable file:// path.
 * Avoids "Missing READ permission" from FileSystemUploadTask on content:// URIs.
 */
async function ensureReadableUploadUri(uri: string, fileName: string): Promise<string> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) return uri;

  const safeName = fileName.replace(/[^\w.\-]+/g, '_') || 'directory-upload.xlsx';
  const dest = `${cache}campus-directory-upload-${Date.now()}-${safeName}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

export async function uploadDirectoryCsvApi(
  token?: string,
  tenantId?: string,
  file?: { uri: string; name: string; size?: number; mimeType?: string },
  _fallbackContent?: string,
): Promise<ImportBatchResult> {
  const effectiveTenant = tenantId || publicEnv.tenantId || 'nmit';

  if (!file?.uri) {
    throw new Error('Please select a directory file first');
  }

  if (!token || token.startsWith('mock-')) {
    throw new Error('Sign in with a real Super Admin account to upload. Mock tokens cannot import.');
  }

  const url = `${publicEnv.apiUrl}/users/import`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Tenant-Id': effectiveTenant,
  };

  const isExcel =
    file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xls') ||
    file.mimeType?.includes('spreadsheet') ||
    file.mimeType?.includes('excel');

  const mimeType = file.mimeType || (isExcel ? XLSX_MIME : 'text/csv');
  const uploadFileName = file.name || (isExcel ? 'directory.xlsx' : 'directory.csv');

  let statusCode = 200;
  let rawBody = '';

  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    const formData = new FormData();
    formData.append('file', blob, uploadFileName);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    statusCode = response.status;
    rawBody = await response.text();
  } else {
    // Same as CDRMS: cache copy + legacy uploadAsync (new File().upload hits READ errors).
    const fileUri = await ensureReadableUploadUri(file.uri, uploadFileName);
    const uploadResult = await FileSystem.uploadAsync(url, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      parameters: {
        filename: uploadFileName,
      },
      headers,
      sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
    });
    statusCode = uploadResult.status;
    rawBody = uploadResult.body ?? '';
  }

  let json: any = {};
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new Error(`Server returned status ${statusCode}: ${rawBody.slice(0, 120)}`);
  }

  if (statusCode >= 400 || json.success === false) {
    const err = Array.isArray(json.message) ? json.message.join(', ') : json.message;
    throw new Error(err || `Import failed with status ${statusCode}`);
  }

  if (json?.data) {
    return json.data as ImportBatchResult;
  }

  throw new Error('Import succeeded but returned no batch result');
}
