import { apiRequest } from '@/lib/api/api-client';

import {
  FoodBusiness,
  FoodBusinessList,
  FoodCart,
  FoodDeliveryType,
  FoodOrder,
  FoodOrderItemPayload,
  FoodPaymentType,
  FoodProductList,
  FoodStatus,
} from './food-types';

function asBusinessList(data: FoodBusinessList | FoodBusiness[] | null | undefined): FoodBusiness[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function fetchFoodStatusApi(token: string, tenantId: string): Promise<FoodStatus> {
  return apiRequest<FoodStatus>('/food/status', { token, tenantId });
}

export async function fetchFoodBusinessesApi(
  token: string,
  tenantId: string,
  search?: string,
): Promise<FoodBusiness[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiRequest<FoodBusinessList | FoodBusiness[]>(`/food/businesses${qs}`, {
    token,
    tenantId,
  });
  return asBusinessList(data);
}

export async function fetchFoodBusinessApi(
  token: string,
  tenantId: string,
  businessId: string,
): Promise<FoodBusiness> {
  return apiRequest<FoodBusiness>(`/food/businesses/${businessId}`, { token, tenantId });
}

export async function fetchFoodProductsApi(
  token: string,
  tenantId: string,
  businessId: string,
): Promise<FoodProductList> {
  return apiRequest<FoodProductList>(`/food/businesses/${businessId}/products?pageSize=50`, {
    token,
    tenantId,
  });
}

export async function updateFoodCartApi(
  token: string,
  tenantId: string,
  payload: {
    business_id: string;
    delivery_type: FoodDeliveryType;
    order_items: FoodOrderItemPayload[];
    customer_note?: string;
  },
): Promise<FoodCart> {
  return apiRequest<FoodCart>('/food/cart', {
    method: 'PUT',
    token,
    tenantId,
    body: payload,
  });
}

export async function createFoodOrderApi(
  token: string,
  tenantId: string,
  payload: {
    business_id: string;
    checkout_id: string;
    delivery_type: FoodDeliveryType;
    payment_type: FoodPaymentType;
    order_items: FoodOrderItemPayload[];
    customer_note?: string;
  },
): Promise<FoodOrder> {
  return apiRequest<FoodOrder>('/food/orders', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function fetchFoodOrderApi(
  token: string,
  tenantId: string,
  orderId: string,
): Promise<FoodOrder> {
  return apiRequest<FoodOrder>(`/food/orders/${orderId}`, { token, tenantId });
}

export async function claimFoodCodPaymentApi(
  token: string,
  tenantId: string,
  orderId: string,
): Promise<FoodOrder> {
  return apiRequest<FoodOrder>(`/food/orders/${orderId}/payment`, {
    method: 'POST',
    token,
    tenantId,
  });
}

export async function fetchMyFoodOrdersApi(
  token: string,
  tenantId: string,
): Promise<FoodOrder[]> {
  const data = await apiRequest<{ results?: FoodOrder[] } | FoodOrder[]>('/food/orders', {
    token,
    tenantId,
  });
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export function formatPaise(paise?: number | null): string {
  if (paise == null || Number.isNaN(paise)) return '—';
  return `₹${(paise / 100).toFixed(2)}`;
}

export function newCheckoutId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chk-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
