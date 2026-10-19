import { apiRequest } from '@/lib/api/api-client';
import { CreateOutpassInput, GateScanResult, OutpassItem } from '../types/outpass.types';

interface SessionAuth {
  token: string;
  tenantId: string;
}

function authHeaders(auth: SessionAuth) {
  return {
    token: auth.token,
    tenantId: auth.tenantId,
  };
}

export const outpassApi = {
  getMyRequests(auth: SessionAuth): Promise<OutpassItem[]> {
    return apiRequest<OutpassItem[]>('/outpass/my-requests', {
      ...authHeaders(auth),
    });
  },

  createRequest(auth: SessionAuth, body: CreateOutpassInput): Promise<OutpassItem> {
    return apiRequest<OutpassItem>('/outpass', {
      method: 'POST',
      ...authHeaders(auth),
      body,
    });
  },

  getById(auth: SessionAuth, id: string): Promise<OutpassItem> {
    return apiRequest<OutpassItem>(`/outpass/${id}`, {
      ...authHeaders(auth),
    });
  },

  cancelRequest(auth: SessionAuth, id: string): Promise<OutpassItem> {
    return apiRequest<OutpassItem>(`/outpass/${id}/cancel`, {
      method: 'PATCH',
      ...authHeaders(auth),
    });
  },

  getAdminRequests(auth: SessionAuth): Promise<OutpassItem[]> {
    return apiRequest<OutpassItem[]>('/outpass/admin/requests', {
      ...authHeaders(auth),
    });
  },

  reviewRequest(
    auth: SessionAuth,
    id: string,
    body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
  ): Promise<OutpassItem> {
    return apiRequest<OutpassItem>(`/outpass/${id}/review`, {
      method: 'PATCH',
      ...authHeaders(auth),
      body,
    });
  },

  gateScan(
    auth: SessionAuth,
    body: { qrToken: string; scanType?: 'EXIT' | 'ENTRY' }
  ): Promise<GateScanResult> {
    return apiRequest<GateScanResult>('/outpass/gate-scan', {
      method: 'POST',
      ...authHeaders(auth),
      body,
    });
  },
};
