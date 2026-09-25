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
