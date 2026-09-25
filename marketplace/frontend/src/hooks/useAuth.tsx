import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService, setTokens, clearTokens } from '@/services/api'
import type { LoginPayload, MFAPayload, RegisterPayload, Seller } from '@/types/auth'

export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: seller, isLoading } = useQuery<Seller, Error>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authService.getMe()
      return res.data
    },
    retry: false,
    staleTime: 1000 * 60 * 10,
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: () => {
      navigate('/auth/login?registered=true')
    },
  })

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      setTokens(response.data)
      if (response.data.mfa_required) {
        navigate(`/auth/login?mfa=true&email=${encodeURIComponent(response.config.data ? JSON.parse(response.config.data).email : '')}`)
      } else {
        queryClient.invalidateQueries({ queryKey: ['me'] })
        navigate('/seller')
      }
    },
  })

  const verifyMFAMutation = useMutation({
    mutationFn: (payload: MFAPayload) => authService.verifyMFA(payload),
    onSuccess: (response) => {
      setTokens(response.data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate('/seller')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: (refresh: string) => authService.logout(refresh),
    onSettled: () => {
      clearTokens()
      queryClient.clear()
      navigate('/')
    },
  })

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      navigate('/auth/login?verified=true')
    },
  })

  const isAuthenticated = !!seller

  return {
    seller,
    isLoading,
    isAuthenticated,
    registerMutation,
    loginMutation,
    verifyMFAMutation,
    logoutMutation,
    verifyEmailMutation,
  }
}