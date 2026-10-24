import { apiRequest } from '@/lib/api/api-client';
import {
  CommunityPost,
  CreatePostPayload,
  MySubmissionsData,
} from '../types/community-types';

export async function fetchCommunityFeedApi(
  token?: string,
  tenantId?: string,
  tab?: string,
  page: number = 1,
  limit: number = 20,
): Promise<CommunityPost[]> {
  const queryParts: string[] = [];
  if (tab) queryParts.push(`tab=${encodeURIComponent(tab)}`);
  if (page) queryParts.push(`page=${page}`);
  if (limit) queryParts.push(`limit=${limit}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiRequest<CommunityPost[]>(`/community/posts${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createCommunityPostApi(
  token: string,
  tenantId: string,
  payload: CreatePostPayload,
): Promise<CommunityPost> {
  return apiRequest<CommunityPost>('/community/posts', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function fetchMySubmissionsApi(
  token: string,
  tenantId: string,
): Promise<MySubmissionsData> {
  return apiRequest<MySubmissionsData>('/community/my-submissions', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function togglePostLikeApi(
  token: string,
  tenantId: string,
  postId: string,
): Promise<{ likeCount: number; isLikedByMe: boolean }> {
  return apiRequest<{ likeCount: number; isLikedByMe: boolean }>(
    `/community/posts/${postId}/like`,
    {
      method: 'POST',
      token,
      tenantId,
    },
  );
}

export async function addPostCommentApi(
  token: string,
  tenantId: string,
  postId: string,
  content: string,
): Promise<CommunityPost> {
  return apiRequest<CommunityPost>(`/community/posts/${postId}/comments`, {
    method: 'POST',
    token,
    tenantId,
    body: { content },
  });
}

export async function deletePostApi(
  token: string,
  tenantId: string,
  postId: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/community/posts/${postId}`, {
    method: 'DELETE',
    token,
    tenantId,
  });
}
