import { apiClient } from '@/services/api'
import type {
  AdminAnalytics,
  AdminStats,
  ModerationAction,
  ModerationProduct,
  PaginatedResponse,
  ProductReport,
  SellerAnalytics,
  SellerListItem,
  SellerModerationAction,
} from '@/types/admin'

export const adminService = {
  getModerationQueue: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<ModerationProduct>>('/admin/products/', { params }),

  moderateProduct: (id: string, payload: ModerationAction) =>
    apiClient.post<{ detail: string; status: string }>(
      `/admin/products/${id}/moderate/`,
      payload
    ),

  getAdminStats: () =>
    apiClient.get<AdminStats>('/admin/stats/'),

  getSellers: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<SellerListItem>>('/auth/admin/sellers/', { params }),

  moderateSeller: (uuid: string, payload: SellerModerationAction) =>
    apiClient.post(`/auth/admin/sellers/${uuid}/moderate/`, payload),

  getReports: (params?: Record<string, string>) =>
    apiClient.get<PaginatedResponse<ProductReport>>('/reports/', { params }),

  updateReport: (id: string, status: 'REVIEWED' | 'DISMISSED' | 'OPEN') =>
    apiClient.patch<ProductReport>(`/reports/${id}/`, { status }),

  getAdminAnalytics: () =>
    apiClient.get<AdminAnalytics>('/analytics/admin/'),

  getSellerAnalytics: () =>
    apiClient.get<SellerAnalytics>('/analytics/sellers/me/'),
}