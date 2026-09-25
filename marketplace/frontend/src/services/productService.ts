import { apiClient } from '@/services/api'
import type {
  AttributeDefinition,
  Brand,
  Category,
  Product,
  ProductCreatePayload,
  ProductListResponse,
} from '@/types/product'

export const productService = {
  // Public
  listProducts: (params?: Record<string, string>) =>
    apiClient.get<ProductListResponse>('/products/', { params }),
  getProduct: (slug: string) => apiClient.get<Product>(`/products/${slug}/`),
  logContact: (slug: string, contactType: 'PHONE' | 'WHATSAPP') =>
    apiClient.post(`/products/${slug}/contact/`, { contact_type: contactType }),

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
}

export const categoryService = {
  getTree: () => apiClient.get<Category[]>('/categories/'),
  getCategory: (slug: string) => apiClient.get<Category>(`/categories/${slug}/`),
  getAttributes: (slug: string) =>
    apiClient.get<AttributeDefinition[]>(`/categories/${slug}/attributes/`),
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

export const contactService = {
  getStats: () => apiClient.get<ContactStat[]>('/contacts/stats/'),
  logContact: (productSlug: string, contactType: 'PHONE' | 'WHATSAPP') =>
    apiClient.post(`/products/${productSlug}/contact/`, { contact_type: contactType }),
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR').replace(/ /g, ' ')
}
