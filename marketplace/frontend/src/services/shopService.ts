import { apiClient } from '@/services/api'
import type { PaginatedResponse, PublicSeller } from '@/types/shop'
import type { Shop, ShopUpdatePayload } from '@/types/shop'

export const shopService = {
  getMyShop: () => apiClient.get<Shop>('/shops/me/'),

  updateMyShop: (data: ShopUpdatePayload) =>
    apiClient.patch<Shop>('/shops/me/', data),

  getPublicShop: (slug: string) =>
    apiClient.get<Shop>(`/shops/${slug}/`),

  getPublicSellers: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<PublicSeller>>('/sellers/', { params }),
}
