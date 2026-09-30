export interface Shop {
  slug: string
  name: string
  description: string
  logo?: string
  phone: string
  whatsapp: string
  city: string
  commune: string
  location: string
  is_active: boolean
  product_count: number
  created_at: string
}

export interface ShopUpdatePayload {
  name?: string
  description?: string
  phone?: string
  whatsapp?: string
  city?: string
  commune?: string
  location?: string
  is_active?: boolean
}

export interface PublicSeller {
  id: string
  business_name: string
  first_name: string
  last_name: string
  city: string
  commune: string
  shop_name: string
  shop_slug: string
  product_count: number
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
