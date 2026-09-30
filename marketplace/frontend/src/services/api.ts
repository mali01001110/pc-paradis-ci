import axios, { AxiosError } from 'axios'
import type {
  AuthTokens,
  ChangePasswordPayload,
  LoginPayload,
  MFAPayload,
  RegisterPayload,
  ApiError,
  Seller,
  RegisterResponse,
  SellerUpdatePayload,
} from '@/types/auth'

export interface CaptchaChallenge {
  question: string
  token: string
}

const API_BASE = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const access = localStorage.getItem('access_token')
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh && !error.config?.url?.includes('/auth/')) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, {
            refresh,
          })
          localStorage.setItem('access_token', data.access)
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh)
          }
          error.config!.headers.Authorization = `Bearer ${data.access}`
          return apiClient.request(error.config!)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  getCaptchaChallenge: () =>
    apiClient.get<CaptchaChallenge>('/auth/captcha/'),

  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>('/auth/register/', payload),

  verifyEmail: (token: string) =>
    apiClient.post(`/auth/verify-email/${token}/`),

  resendVerification: (email: string) =>
    apiClient.post('/auth/resend-verification/', { email }),

  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens>('/auth/login/', payload),

  verifyMFA: (payload: MFAPayload) =>
    apiClient.post<AuthTokens>('/auth/mfa/verify/', payload),

  resendMFA: (email: string) =>
    apiClient.post('/auth/mfa/resend/', { email }),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }),

  getMe: () =>
    apiClient.get<Seller>('/auth/me/'),

  updateMe: (data: Partial<SellerUpdatePayload>) =>
    apiClient.patch<Seller>('/auth/me/', data),

  uploadProfileImage: (field: 'logo' | 'photo', file: File) => {
    const formData = new FormData()
    formData.append('field', field)
    formData.append('image', file)
    return apiClient.post<Seller>('/auth/me/profile-image/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post('/auth/password/change/', payload),

  enableMFA: (password: string) =>
    apiClient.post('/auth/mfa/enable/', { password }),

  disableMFA: (password: string) =>
    apiClient.post('/auth/mfa/disable/', { password }),

  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password/reset/', { email }),

  confirmPasswordReset: (email: string, code: string, password: string) =>
    apiClient.post('/auth/password/reset/confirm/', { email, code, password }),
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function hasValidToken() {
  return !!localStorage.getItem('access_token')
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data?.message === 'string') return data.message
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0]
      const val = data[firstKey]
      if (Array.isArray(val)) return `${firstKey}: ${val[0]}`
      if (typeof val === 'string') return `${firstKey}: ${val}`
    }
  }
  if (error instanceof Error) return error.message
  return 'Une erreur est survenue. Veuillez réessayer.'
}