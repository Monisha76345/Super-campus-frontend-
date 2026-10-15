import { publicEnv } from '@/lib/config/public-env';

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
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.tenantId) {
    headers['X-Tenant-Id'] = options.tenantId;
  }

  let response: Response;
  try {
    response = await fetch(`${publicEnv.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0);
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

  return payload.data as T;
}
