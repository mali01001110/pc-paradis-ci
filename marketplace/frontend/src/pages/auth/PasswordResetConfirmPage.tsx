import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { authService, getErrorMessage } from '@/services/api'

const schema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Au moins 8 caractères'),
    password2: z.string().min(1, 'Confirmez le mot de passe'),
  })
  .refine((d) => d.password === d.password2, {
    path: ['password2'],
    message: 'Les mots de passe ne correspondent pas',
  })

type Form = z.infer<typeof schema>

export default function PasswordResetConfirmPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setGlobalError('')
    try {
      await authService.confirmPasswordReset(
        data.email.toLowerCase(),
        code ?? '',
        data.password
      )
      navigate('/auth/login?reset=success')
    } catch (err) {
      setGlobalError(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0f0a1e]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Saisissez votre email et votre nouveau mot de passe
          </p>
        </div>

        {globalError && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label htmlFor="confirm-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="confirm-email"
                {...register('email')}
                type="email"
                className="input-field pl-10"
                placeholder="vendeur@exemple.ci"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="confirm-password"
                {...register('password')}
                type={showPw ? 'text' : 'password'}
                className="input-field pl-10 pr-10"
                placeholder="Au moins 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="confirm-password2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="confirm-password2"
                {...register('password2')}
                type={showPw ? 'text' : 'password'}
                className="input-field pl-10"
                placeholder="Confirmez le mot de passe"
              />
            </div>
            {errors.password2 && (
              <p className="mt-1 text-xs text-red-500">{errors.password2.message}</p>
            )}
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          <Link to="/auth/login" className="text-primary-600 font-medium hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
