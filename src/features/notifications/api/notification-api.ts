import { apiRequest } from '@/lib/api/api-client';

export type NotificationCategory =
  | 'MESSAGES'
  | 'PROJECTS'
  | 'OUTPASS'
  | 'SPORTS'
  | 'MARKETPLACE'
  | 'CONNECT'
  | 'CAMPUS';

export type NotificationType =
  | 'CHAT_MESSAGE'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'OUTPASS_SUBMITTED'
  | 'OUTPASS_APPROVED'
  | 'OUTPASS_REJECTED'
  | 'OUTPASS_OVERDUE'
  | 'SPORTS_PLAYER_JOINED'
  | 'SPORTS_TEAMMATE_ADDED'
  | 'SPORTS_BOOKING_CANCELLED'
  | 'PROJECT_APPLICATION'
  | 'MARKETPLACE_LISTING_APPROVED'
  | 'MARKETPLACE_LISTING_REJECTED'
  | 'CAMPUS_ANNOUNCEMENT';

export interface AppNotificationItem {
  id: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  actorId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  messagesEnabled: boolean;
  projectsEnabled: boolean;
  outpassEnabled: boolean;
  sportsEnabled: boolean;
  marketplaceEnabled: boolean;
  connectEnabled: boolean;
  campusEnabled: boolean;
}

interface SessionAuth {
  token: string;
  tenantId: string;
}

function auth(authSession: SessionAuth) {
  return { token: authSession.token, tenantId: authSession.tenantId };
}

export const notificationApi = {
  list(session: SessionAuth, limit = 50, offset = 0): Promise<AppNotificationItem[]> {
    return apiRequest<AppNotificationItem[]>(
      `/notifications?limit=${limit}&offset=${offset}`,
      auth(session),
    );
  },

  unreadCount(session: SessionAuth): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('/notifications/unread-count', auth(session));
  },

  markRead(session: SessionAuth, id: string): Promise<AppNotificationItem> {
    return apiRequest<AppNotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
      ...auth(session),
    });
  },

  markAllRead(session: SessionAuth): Promise<{ updated: number }> {
    return apiRequest<{ updated: number }>('/notifications/read-all', {
      method: 'POST',
      ...auth(session),
    });
  },

  registerDeviceToken(
    session: SessionAuth,
    token: string,
    platform: 'IOS' | 'ANDROID' | 'WEB' | 'UNKNOWN',
  ): Promise<{ ok: true }> {
    return apiRequest<{ ok: true }>('/notifications/device-token', {
      method: 'POST',
      ...auth(session),
      body: { token, platform },
    });
  },

  unregisterDeviceToken(session: SessionAuth, token: string): Promise<{ ok: true }> {
    return apiRequest<{ ok: true }>('/notifications/device-token', {
      method: 'DELETE',
      ...auth(session),
      body: { token },
    });
  },

  getPreferences(session: SessionAuth): Promise<NotificationPreference> {
    return apiRequest<NotificationPreference>('/notifications/preferences', auth(session));
  },

  updatePreferences(
    session: SessionAuth,
    body: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    return apiRequest<NotificationPreference>('/notifications/preferences', {
      method: 'PATCH',
      ...auth(session),
      body,
    });
  },
};
