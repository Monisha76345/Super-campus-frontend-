export interface FoodStatus {
  enabled: boolean;
  clusterId: string | null;
}

export interface FoodBusiness {
  business_id: string;
  business_name: string;
  is_open?: boolean;
  base_type?: string;
  has_delivery?: boolean;
  has_self_pick_up?: boolean;
  has_dine_in?: boolean;
  description?: string | null;
  address?: unknown;
  images?: unknown;
  payment_info?: {
    can_pay_before_accept?: boolean;
    pay_before_order_v2?: Record<string, boolean>;
  };
  cod_only?: boolean;
  pay_via_credit_only?: boolean;
}

export interface FoodBusinessList {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: FoodBusiness[];
}

export interface FoodSku {
  sku_id: number;
  sku_code?: string;
  base_price?: number;
  original_price?: number;
  is_active?: boolean;
  in_stock?: boolean;
}

export interface FoodProduct {
  product_id: number;
  product_name: string;
  product_description?: string | null;
  is_active?: boolean;
  in_stock?: boolean;
  is_available?: boolean;
  skus?: FoodSku[];
}

export interface FoodProductList {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: FoodProduct[];
}

export interface FoodCartItem {
  sku_id: number;
  quantity: number;
  unit_price?: number;
  product_name?: string;
}

export interface FoodCart {
  cart_id?: string;
  business_id?: string;
  cart_items?: FoodCartItem[];
  item_total?: number;
  other_charges?: number;
  delivery_charges?: number;
  offer_discount?: number;
  product_discount?: number;
  platform_charge?: number;
  order_total?: number;
  errors?: unknown[];
}

export interface FoodOrder {
  order_id: string;
  business_id?: string;
  business_name?: string;
  order_short_number?: string;
  order_status?: string;
  order_total?: number;
  delivery_type?: string;
  order_items?: FoodCartItem[];
  payment_info?: {
    status?: string;
    payment_type?: string;
    amount?: number;
    razorpay_params?: Record<string, unknown>;
  };
}

export type FoodDeliveryType = 'SELF_PICK_UP' | 'DA_DELIVERY' | 'DINE_IN';
export type FoodPaymentType = 'RAZORPAY' | 'COD';

export interface FoodOrderItemPayload {
  sku_id: number;
  quantity: number;
}

export interface LocalCartLine {
  skuId: number;
  productName: string;
  quantity: number;
  unitPricePaise: number;
}
