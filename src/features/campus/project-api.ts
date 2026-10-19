import { apiRequest } from '@/lib/api/api-client';
import { CreateProjectPayload, Project, ProjectCategory, ProjectStatus } from './project-types';

export interface ProjectFilterParams {
  status?: ProjectStatus;
  category?: ProjectCategory;
  search?: string;
  mine?: boolean;
}

export async function fetchProjectsApi(
  token?: string,
  tenantId?: string,
  params?: ProjectFilterParams,
): Promise<Project[]> {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.mine) queryParts.push(`mine=true`);

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
