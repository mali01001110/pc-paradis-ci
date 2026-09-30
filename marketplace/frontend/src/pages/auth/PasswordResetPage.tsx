import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'
import { authService, getErrorMessage } from '@/services/api'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type Form = z.infer<typeof schema>

export default function PasswordResetPage() {
  const [sent, setSent] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setGlobalError('')
    try {
      await authService.requestPasswordReset(data.email.toLowerCase())
      setSent(true)
    } catch (err) {
      setGlobalError(getErrorMessage(err))
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0f0a1e]">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-2">
              Vérifiez votre email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Si un compte existe avec cette adresse, un code de réinitialisation vous a été
              envoyé. Il expire sous peu.
            </p>
            <Link to="/auth/login" className="btn-primary w-full inline-flex justify-center">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0f0a1e]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Saisissez votre email pour recevoir un code de réinitialisation
          </p>
        </div>

        {globalError && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="reset-email"
                {...register('email')}
                type="email"
                className="input-field pl-10"
                placeholder="vendeur@exemple.ci"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi…' : 'Envoyer le code'}
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
