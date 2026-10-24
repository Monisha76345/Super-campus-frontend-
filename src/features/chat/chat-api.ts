import { apiRequest } from '@/lib/api/api-client';
import { ChatMessage, ChatThread, SearchUser } from './types';

export async function fetchThreadsApi(token: string, tenantId: string): Promise<ChatThread[]> {
  return apiRequest<ChatThread[]>('/chat/threads', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchMessagesApi(
  token: string,
  tenantId: string,
  threadId: string,
): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/chat/threads/${threadId}/messages`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function startDirectChatApi(
  token: string,
  tenantId: string,
  recipientUserId: string,
): Promise<ChatThread> {
  return apiRequest<ChatThread>('/chat/threads/direct', {
    method: 'POST',
    token,
    tenantId,
    body: { recipientUserId },
  });
}

export async function sendMessageApi(
  token: string,
  tenantId: string,
  threadId: string,
  content: string,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/chat/threads/${threadId}/messages`, {
    method: 'POST',
    token,
    tenantId,
    body: { content },
  });
}

export async function searchUsersApi(
  token: string,
  tenantId: string,
  query: string,
): Promise<SearchUser[]> {
  const qs = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
  return apiRequest<SearchUser[]>(`/chat/users/search${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createGroupChatApi(
  token: string,
  tenantId: string,
  name: string,
  memberUserIds: string[],
): Promise<ChatThread> {
  return apiRequest<ChatThread>('/chat/threads/group', {
    method: 'POST',
    token,
    tenantId,
    body: { name, memberUserIds },
  });
}

export async function fetchThreadDetailsApi(
  token: string,
  tenantId: string,
  threadId: string,
): Promise<ChatThread> {
  return apiRequest<ChatThread>(`/chat/threads/${threadId}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function updateGroupChatApi(
  token: string,
  tenantId: string,
  threadId: string,
  body: { name?: string; addMemberUserIds?: string[]; removeUserId?: string },
): Promise<ChatThread> {
  return apiRequest<ChatThread>(`/chat/threads/${threadId}/group`, {
    method: 'PATCH',
    token,
    tenantId,
    body,
  });
}
