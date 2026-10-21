import { apiRequest } from '@/lib/api/api-client';
import {
  CampusClub,
  CampusEvent,
  CampusOpportunity,
  ConnectMember,
  CreateEventPayload,
  IncomingConnectionRequest,
} from '../types/connect-types';

export async function fetchEventsApi(token: string, tenantId: string): Promise<CampusEvent[]> {
  return apiRequest<CampusEvent[]>('/connect/events', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createEventApi(
  token: string,
  tenantId: string,
  payload: CreateEventPayload,
): Promise<CampusEvent> {
  return apiRequest<CampusEvent>('/connect/events', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function fetchClubsApi(token: string, tenantId: string): Promise<CampusClub[]> {
  return apiRequest<CampusClub[]>('/connect/clubs', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchOpportunitiesApi(
  token: string,
  tenantId: string,
  type?: 'INTERNSHIP' | 'JOB',
): Promise<CampusOpportunity[]> {
  const qs = type ? `?type=${type}` : '';
  return apiRequest<CampusOpportunity[]>(`/connect/opportunities${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createOpportunityApi(
  token: string,
  tenantId: string,
  payload: import('../types/connect-types').CreateOpportunityPayload,
): Promise<CampusOpportunity> {
  return apiRequest<CampusOpportunity>('/connect/opportunities', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function fetchMembersApi(
  token: string,
  tenantId: string,
  params: { role?: string; batch?: string; query?: string },
): Promise<ConnectMember[]> {
  const searchParams = new URLSearchParams();
  if (params.role) searchParams.append('role', params.role);
  if (params.batch) searchParams.append('batch', params.batch);
  if (params.query) searchParams.append('q', params.query);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return apiRequest<ConnectMember[]>(`/connect/members${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchMemberProfileApi(
  token: string,
  tenantId: string,
  userId: string,
): Promise<ConnectMember> {
  return apiRequest<ConnectMember>(`/connect/members/${userId}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function sendConnectionRequestApi(
  token: string,
  tenantId: string,
  userId: string,
): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/connect/members/${userId}/connect`, {
    method: 'POST',
    token,
    tenantId,
  });
}

export async function fetchIncomingRequestsApi(
  token: string,
  tenantId: string,
): Promise<IncomingConnectionRequest[]> {
  return apiRequest<IncomingConnectionRequest[]>('/connect/requests/incoming', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function respondConnectionRequestApi(
  token: string,
  tenantId: string,
  connectionId: string,
  action: 'ACCEPT' | 'DECLINE',
): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(`/connect/requests/${connectionId}/respond`, {
    method: 'POST',
    token,
    tenantId,
    body: { action },
  });
}

export async function fetchMyConnectionsApi(
  token: string,
  tenantId: string,
): Promise<ConnectMember[]> {
  return apiRequest<ConnectMember[]>('/connect/connections/mine', {
    method: 'GET',
    token,
    tenantId,
  });
}
