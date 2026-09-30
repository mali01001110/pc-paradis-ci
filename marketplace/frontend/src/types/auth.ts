export interface Seller {
  id: string
  email: string
  first_name: string
  last_name: string
  business_name: string
  phone: string
  whatsapp: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  email_verified: boolean
  mfa_enabled: boolean
  is_staff: boolean
  created_at: string
  profile?: SellerProfile
}

export interface SellerProfile {
  logo?: string
  photo?: string
  description: string
  city: string
  commune: string
  location: string
}

export interface RegisterPayload {
  email: string
  first_name: string
  last_name: string
  business_name: string
  phone: string
  whatsapp: string
  password: string
  password2: string
  terms_accepted: boolean
  captcha_token: string
  captcha_answer: string
  /** Honeypot — must stay empty. */
  website?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthTokens {
  access: string
  refresh: string
  mfa_required?: boolean
}

export interface ApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}

export interface RegisterResponse {
  detail: string
  email: string
}

export interface VerifyEmailResponse {
  detail: string
}

export interface MFAChallengeResponse {
  detail: string
  mfa_required: boolean
}

export interface MFAPayload {
  email: string
  code: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface SellerUpdatePayload {
  first_name?: string
  last_name?: string
  business_name?: string
  phone?: string
  whatsapp?: string
  profile?: Partial<SellerProfile>
}