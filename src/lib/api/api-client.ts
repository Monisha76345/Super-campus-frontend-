import { publicEnv } from '@/lib/config/public-env';
import { sessionStorage } from '@/lib/storage/session-storage';
import { ApiError } from './api-error';

interface ApiSuccessBody<T> {
  success: boolean;
  message: string;
  data: T | null;
  errorCode?: string | null;
}

interface ApiErrorBody {
  success?: boolean;
  message?: string | string[];
  errorCode?: string | null;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  tenantId?: string;
}

function readMessage(body: ApiErrorBody, fallback: string): string {
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Token resolution: use passed token or fallback to saved session token
  let token = options.token?.trim();
  let tenantId = options.tenantId?.trim();

  if (!token || !tenantId) {
    try {
      const saved = await sessionStorage.read<{ token?: string; tenantId?: string }>();
      if (!token && saved?.token) {
        token = saved.token.trim();
      }
      if (!tenantId && saved?.tenantId) {
        tenantId = saved.tenantId.trim();
      }
    } catch {
      // Ignore session storage read errors
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  let response: Response;
  const targetUrl = `${publicEnv.apiUrl}${path}`;
  try {
    response = await fetch(targetUrl, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err: any) {
    console.error(`[API ERROR] Cannot reach ${targetUrl}:`, err?.message ?? err);
    throw new ApiError(`Cannot reach the server at ${publicEnv.apiUrl}. Check your network connection.`, 0);
  }

  let payload = {} as ApiSuccessBody<T> & ApiErrorBody;
  try {
    payload = (await response.json()) as ApiSuccessBody<T> & ApiErrorBody;
  } catch {
    if (!response.ok) {
      throw new ApiError('Request failed', response.status);
    }
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(
      readMessage(payload, 'Request failed'),
      response.status,
      payload.errorCode ?? null,
    );
  }

  return (payload.data !== undefined ? payload.data : payload) as T;
}
