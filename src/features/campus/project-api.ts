import { apiRequest } from '@/lib/api/api-client';
import {
  CreateProjectPayload,
  Project,
  ProjectApplication,
  ProjectCategory,
  ProjectContribution,
  ProjectStatus,
} from './project-types';

export interface ProjectFilterParams {
  status?: ProjectStatus;
  category?: ProjectCategory;
  search?: string;
  mine?: boolean;
  domain?: string;
  supportOffered?: string;
  supportRequired?: string;
}

export async function fetchProjectsApi(
  token?: string,
  tenantId?: string,
  params?: ProjectFilterParams,
): Promise<Project[]> {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.search && params.search.trim()) queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  if (params?.mine) queryParts.push(`mine=true`);
  if (params?.domain && params.domain !== 'All') queryParts.push(`domain=${encodeURIComponent(params.domain)}`);
  if (params?.supportOffered && params.supportOffered !== 'All') {
    queryParts.push(`supportOffered=${encodeURIComponent(params.supportOffered)}`);
  }
  if (params?.supportRequired && params.supportRequired !== 'All') {
    queryParts.push(`supportRequired=${encodeURIComponent(params.supportRequired)}`);
  }

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiRequest<Project[]>(`/projects${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createProjectApi(
  token: string,
  tenantId: string,
  payload: CreateProjectPayload,
): Promise<Project> {
  return apiRequest<Project>('/projects', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function updateProjectStatusApi(
  token: string,
  tenantId: string,
  projectId: string,
  status: ProjectStatus,
): Promise<Project> {
  return apiRequest<Project>(`/projects/${projectId}/status`, {
    method: 'PATCH',
    token,
    tenantId,
    body: { status },
  });
}

export async function deleteProjectApi(
  token: string,
  tenantId: string,
  projectId: string,
): Promise<void> {
  return apiRequest<void>(`/projects/${projectId}`, {
    method: 'DELETE',
    token,
    tenantId,
  });
}

export async function fundProjectApi(
  token: string,
  tenantId: string,
  projectId: string,
  body: {
    amount: number;
    fundingType: 'COLLEGE_FUNDING' | 'CROWDFUNDING';
    notes?: string;
    paymentMethod?: string;
    orderId?: string;
  },
): Promise<{ contribution: ProjectContribution; project: Project }> {
  return apiRequest<{ contribution: ProjectContribution; project: Project }>(
    `/projects/${projectId}/fund`,
    {
      method: 'POST',
      token,
      tenantId,
      body,
    },
  );
}

export async function applyToProjectApi(
  token: string,
  tenantId: string,
  projectId: string,
  body: {
    roleApplied: string;
    supportId?: string;
    message?: string;
  },
): Promise<ProjectApplication> {
  return apiRequest<ProjectApplication>(`/projects/${projectId}/apply`, {
    method: 'POST',
    token,
    tenantId,
    body,
  });
}

export async function fetchProjectApplicationsApi(
  token: string,
  tenantId: string,
  projectId: string,
): Promise<ProjectApplication[]> {
  return apiRequest<ProjectApplication[]>(`/projects/${projectId}/applications`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchProjectContributionsApi(
  token: string,
  tenantId: string,
  projectId: string,
): Promise<ProjectContribution[]> {
  return apiRequest<ProjectContribution[]>(`/projects/${projectId}/contributions`, {
    method: 'GET',
    token,
    tenantId,
  });
}
