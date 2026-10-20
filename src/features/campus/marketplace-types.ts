export type MarketplaceCategory =
  | 'All'
  | 'Uncategorized'
  | 'Bags & Luggage'
  | 'Bicycles'
  | 'Books & Study Material'
  | 'Clothing & Accessories'
  | 'Electronics'
  | 'Furniture'
  | 'Instruments & Equipment'
  | 'Other'
  | 'Sports & Fitness'
  | 'Stationery';

export type MarketplaceCondition = 'new' | 'like new' | 'good' | 'fair' | 'poor';

export type MarketplaceStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SOLD';

export interface MarketplaceItem {
  id: string;
  campusId: string;
  title: string;
  description: string;
  price: number;
  condition: MarketplaceCondition;
  category: MarketplaceCategory;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerRole: string;
  status: MarketplaceStatus;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceItemPayload {
  title: string;
  description: string;
  price: number;
  condition: MarketplaceCondition;
  category: MarketplaceCategory;
  images?: string[];
}

export interface MarketplaceFilterParams {
  category?: string;
  condition?: MarketplaceCondition;
  search?: string;
  status?: MarketplaceStatus;
}
