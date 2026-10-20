import { apiRequest } from '@/lib/api/api-client';
import {
  CreateMarketplaceItemPayload,
  MarketplaceFilterParams,
  MarketplaceItem,
  MarketplaceStatus,
} from './marketplace-types';

export async function fetchMarketplaceItemsApi(
  token?: string,
  tenantId?: string,
  params?: MarketplaceFilterParams,
): Promise<MarketplaceItem[]> {
  const queryParts: string[] = [];
  if (params?.category && params.category !== 'All') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params?.condition) {
    queryParts.push(`condition=${encodeURIComponent(params.condition)}`);
  }
  if (params?.search && params.search.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params?.status) {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return apiRequest<MarketplaceItem[]>(`/marketplace/items${qs}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchMyMarketplaceItemsApi(
  token: string,
  tenantId: string,
): Promise<MarketplaceItem[]> {
  return apiRequest<MarketplaceItem[]>('/marketplace/items/my', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchPendingMarketplaceItemsApi(
  token: string,
  tenantId: string,
): Promise<MarketplaceItem[]> {
  return apiRequest<MarketplaceItem[]>('/marketplace/items/pending', {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function fetchMarketplaceItemByIdApi(
  token: string,
  tenantId: string,
  id: string,
): Promise<MarketplaceItem> {
  return apiRequest<MarketplaceItem>(`/marketplace/items/${id}`, {
    method: 'GET',
    token,
    tenantId,
  });
}

export async function createMarketplaceItemApi(
  token: string,
  tenantId: string,
  payload: CreateMarketplaceItemPayload,
): Promise<MarketplaceItem> {
  return apiRequest<MarketplaceItem>('/marketplace/items', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function updateMarketplaceItemStatusApi(
  token: string,
  tenantId: string,
  itemId: string,
  status: MarketplaceStatus,
  rejectionReason?: string,
): Promise<MarketplaceItem> {
  return apiRequest<MarketplaceItem>(`/marketplace/items/${itemId}/status`, {
    method: 'PATCH',
    token,
    tenantId,
    body: { status, rejectionReason },
  });
}

export async function toggleMarketplaceItemLikeApi(
  token: string,
  tenantId: string,
  itemId: string,
): Promise<{ isLiked: boolean; likeCount: number }> {
  return apiRequest<{ isLiked: boolean; likeCount: number }>(
    `/marketplace/items/${itemId}/like`,
    {
      method: 'POST',
      token,
      tenantId,
    },
  );
}

export async function deleteMarketplaceItemApi(
  token: string,
  tenantId: string,
  itemId: string,
): Promise<null> {
  return apiRequest<null>(`/marketplace/items/${itemId}`, {
    method: 'DELETE',
    token,
    tenantId,
  });
}
