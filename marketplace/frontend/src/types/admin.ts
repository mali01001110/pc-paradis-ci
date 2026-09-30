export type ProductStatus = 'AVAILABLE' | 'SOLD' | 'HIDDEN' | 'PENDING_REVIEW' | 'REJECTED'
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED'
export type ReportReason =
  | 'PROHIBITED'
  | 'FRAUD'
  | 'FALSE_INFO'
  | 'MISLEADING'
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'OTHER'

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  PROHIBITED: 'Produit interdit',
  FRAUD: 'Fraude suspectée',
  FALSE_INFO: 'Fausse information',
  MISLEADING: 'Annonce trompeuse',
  SPAM: 'Spam',
  INAPPROPRIATE: 'Contenu inapproprié',
  OTHER: 'Autre',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  AVAILABLE: 'En ligne',
  SOLD: 'Vendu',
  HIDDEN: 'Masqué',
  PENDING_REVIEW: 'En modération',
  REJECTED: 'Rejeté',
}

export interface ModerationProduct {
  id: string
  slug: string
  title: string
  model: string
  price: number
  currency: string
  condition: string
  status: ProductStatus
  city: string
  views_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  seller: {
    id: string
    email: string
    business_name: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  brand: {
    id: string
    name: string
  } | null
  images: Array<{ id: string; image: string; is_primary: boolean; sort_order: number }>
}

export interface ModerationAction {
  action: 'approve' | 'reject' | 'hide' | 'restore'
}

export interface AdminStats {
  total_products: number
  available: number
  sold: number
  hidden: number
  pending_review: number
  rejected: number
  deleted: number
  total_views: number
  top_categories: Array<{ slug: string; name: string; count: number }>
}

export interface SellerListItem {
  id: string
  business_name: string
  first_name: string
  last_name: string
  email: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  email_verified: boolean
  mfa_enabled: boolean
  city: string
  commune: string
  product_count: number
  created_at: string
}

export interface SellerModerationAction {
  action: 'suspend' | 'ban' | 'unsuspend'
}

export interface ProductReport {
  id: string
  product: string
  product_title: string
  product_slug: string
  product_category_slug?: string
  reporter_email: string
  reason: ReportReason
  description: string
  status: ReportStatus
  created_at: string
}

export interface AdminAnalytics {
  total_views: number
  total_products: number
  total_sellers: number
  total_shops: number
  total_categories: number
  total_contacts: number
  by_category: Array<{
    category__name: string
    category__slug: string
    views: number
    products: number
  }>
  top_searches: Array<{ query: string; search_count: number }>
}

export interface SellerAnalyticsProduct {
  product_id: string
  title: string
  total_views: number
  phone_contacts: number
  whatsapp_contacts: number
}

export interface SellerAnalytics {
  total_views: number
  total_phone_contacts: number
  total_whatsapp_contacts: number
  product_count: number
  products: SellerAnalyticsProduct[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}