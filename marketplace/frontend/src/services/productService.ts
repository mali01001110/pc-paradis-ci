import { apiClient } from '@/services/api'
import type { ReportReason } from '@/types/admin'
import type {
  AttributeDefinition,
  Brand,
  Category,
  FilterOptionsResponse,
  Product,
  ProductCreatePayload,
  ProductListResponse,
} from '@/types/product'

export interface ReportProductPayload {
  reason: ReportReason
  description?: string
  reporter_email?: string
}

export const productService = {
  // Public
  listProducts: (params?: Record<string, string>) =>
    apiClient.get<ProductListResponse>('/products/', { params }),
  getProduct: (slug: string) => apiClient.get<Product>(`/products/${slug}/`),
  logContact: (slug: string, contactType: 'PHONE' | 'WHATSAPP') =>
    apiClient.post(`/products/${slug}/contact/`, { contact_type: contactType }),
  reportProduct: (slug: string, payload: ReportProductPayload) =>
    apiClient.post(`/products/${slug}/report/`, payload),

  // Seller
  getMyProducts: (params?: Record<string, string>) =>
    apiClient.get<ProductListResponse>('/products/me/', { params }),
  createProduct: (data: ProductCreatePayload) =>
    apiClient.post<Product>('/products/me/', data),
  getMyProduct: (id: string) => apiClient.get<Product>(`/products/me/${id}/`),
  updateMyProduct: (id: string, data: Partial<ProductCreatePayload>) =>
    apiClient.patch<Product>(`/products/me/${id}/`, data),
  deleteMyProduct: (id: string) =>
    apiClient.delete(`/products/me/${id}/`),

  // Attributes + images
  setAttributes: (id: string, attributes: { attribute: string; value: unknown }[]) =>
    apiClient.post(`/products/me/${id}/attributes/`, attributes),
  uploadImages: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('images', f))
    return apiClient.post(`/products/me/${id}/images/`, form)
  },
  deleteImage: (id: string, imageId: string) =>
    apiClient.delete(`/products/me/${id}/images/${imageId}/`),
  reorderImages: (id: string, order: string[]) =>
    apiClient.patch(`/products/me/${id}/images/reorder/`, { order }),

  // Analytics (§37)
  getProductAnalytics: (id: string) =>
    apiClient.get<ProductAnalytics>(`/analytics/products/${id}/`),
}

export interface ProductAnalytics {
  product_id: string
  title: string
  total_views: number
  daily_views: Array<{ date: string; count: number }>
}

export const categoryService = {
  getTree: () => apiClient.get<Category[]>('/categories/'),
  getCategory: (slug: string) => apiClient.get<Category>(`/categories/${slug}/`),
  getAttributes: (slug: string) =>
    apiClient.get<AttributeDefinition[]>(`/categories/${slug}/attributes/`),
  getFilterOptions: (slug: string) =>
    apiClient.get<FilterOptionsResponse>(`/categories/${slug}/filter-options/`),
  getBrands: () => apiClient.get<Brand[]>('/brands/'),
}

export interface ContactStat {
  id: string
  title: string
  slug: string
  total_contacts: number
  phone_contacts: number
  whatsapp_contacts: number
  views_count: number
}

export interface ContactEvent {
  id: string
  product_title: string
  contact_type: 'PHONE' | 'WHATSAPP'
  created_at: string
}

export const contactService = {
  getStats: () => apiClient.get<ContactStat[]>('/contacts/stats/'),
  getContacts: (params?: Record<string, string>) =>
    apiClient.get<ContactEvent[]>('/contacts/', { params }),
  logContact: (productSlug: string, contactType: 'PHONE' | 'WHATSAPP') =>
    apiClient.post(`/products/${productSlug}/contact/`, { contact_type: contactType }),
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR').replace(/ /g, ' ')
}
