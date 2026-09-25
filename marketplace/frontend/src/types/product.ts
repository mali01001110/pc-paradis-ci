export interface ProductImage {
  id: string
  image: string
  is_primary: boolean
  sort_order: number
}

export interface ProductAttributeValue {
  id: string
  key: string
  label: string
  value: string | number | boolean | string[]
}

export interface Product {
  id: string
  slug: string
  title: string
  model: string
  description: string
  price: number
  currency: 'FCFA'
  condition: 'NEUF' | 'OCCASION' | 'RECONDITIONNE' | 'UTILISE'
  condition_display: string
  status: 'AVAILABLE' | 'SOLD' | 'HIDDEN' | 'PENDING_REVIEW' | 'REJECTED'
  status_display: string
  city: string
  commune: string
  phone: string
  whatsapp: string
  views_count: number
  seller_id?: string
  brand_id?: string
  category_id?: string
  brand_name?: string
  category_slug?: string
  seller_name?: string
  images: ProductImage[]
  attributes: ProductAttributeValue[]
  image?: string
  created_at: string
  updated_at: string
}

export interface ProductListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Product[]
}

export interface ProductCreatePayload {
  title: string
  category_id: string
  brand_id?: string
  model?: string
  description?: string
  price: number
  condition: string
  city?: string
  commune?: string
  phone?: string
  whatsapp?: string
}

export interface AttributeDefinition {
  id: string
  key: string
  label: string
  value_type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
  unit: string
  options: string[] | null
  required: boolean
  filterable: boolean
  sort_order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  parent: string | null
  description: string
  icon: string
  sort_order: number
  children?: Category[]
  attributes?: AttributeDefinition[]
}

export interface Brand {
  id: string
  name: string
  slug: string
}
