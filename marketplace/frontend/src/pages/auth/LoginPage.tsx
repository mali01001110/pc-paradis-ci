import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { authService, getErrorMessage } from '@/services/api'
import type { LoginPayload, MFAPayload } from '@/types/auth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const mfaSchema = z.object({
  code: z.string().length(6, 'Code à 6 chiffres'),
})

type LoginForm = z.infer<typeof loginSchema>
type MFAForm = z.infer<typeof mfaSchema>

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [showPw, setShowPw] = useState(false)
  const [mfaEmail, setMfaEmail] = useState('')
  const [step, setStep] = useState<'login' | 'mfa'>(
    searchParams.get('mfa') === 'true' ? 'mfa' : 'login'
  )
  const [globalError, setGlobalError] = useState(
    searchParams.get('registered') === 'true'
      ? 'Compte créé ! Vérifiez votre email pour activer votre compte.'
      : searchParams.get('verified') === 'true'
      ? 'Email confirmé. Vous pouvez vous connecter.'
      : ''
  )

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const mfaForm = useForm<MFAForm>({ resolver: zodResolver(mfaSchema) })

  const onLogin = async (data: LoginForm) => {
    setGlobalError('')
    const payload: LoginPayload = { email: data.email.toLowerCase(), password: data.password }
    try {
      const res = await authService.login(payload)
      if (res.data.mfa_required) {
        setMfaEmail(data.email.toLowerCase())
        setStep('mfa')
        setGlobalError('Entrez le code reçu par email.')
      } else {
        localStorage.setItem('access_token', res.data.access)
        localStorage.setItem('refresh_token', res.data.refresh)
        window.location.href = '/seller'
      }
    } catch (err) {
      setGlobalError(getErrorMessage(err))
    }
  }

  const onMFA = async (data: MFAForm) => {
    setGlobalError('')
    const payload: MFAPayload = { email: mfaEmail, code: data.code }
    try {
      const res = await authService.verifyMFA(payload)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      window.location.href = '/seller'
    } catch (err) {
      setGlobalError(getErrorMessage(err))
    }
  }

  const resendCode = async () => {
    try {
      await authService.resendMFA(mfaEmail)
      setGlobalError('Nouveau code envoyé.')
    } catch {
      setGlobalError('Erreur lors du renvoi du code.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0f0a1e]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            {step === 'login' ? 'Connexion vendeur' : 'Code de sécurité'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {step === 'login' ? 'Accédez à votre espace de vente' : 'Entrez le code reçu par email'}
          </p>
        </div>

        {globalError && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${globalError.includes('créé') || globalError.includes('confirmé') || globalError.includes('envoyé') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            {globalError}
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input {...loginForm.register('email')} type="email" className="input-field" placeholder="vendeur@exemple.ci" />
              {loginForm.formState.errors.email && <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
              <div className="relative">
                <input {...loginForm.register('password')} type={showPw ? 'text' : 'password'} className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginForm.formState.errors.password && <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={mfaForm.handleSubmit(onMFA)} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code à 6 chiffres</label>
              <input {...mfaForm.register('code')} className="input-field text-center text-2xl tracking-widest font-mono" placeholder="000000" maxLength={6} />
              {mfaForm.formState.errors.code && <p className="mt-1 text-xs text-red-500">{mfaForm.formState.errors.code.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={mfaForm.formState.isSubmitting}>
              Vérifier
            </button>
            <button type="button" onClick={resendCode} className="w-full text-sm text-primary-600 hover:underline">
              Je n'ai pas reçu de code → Renvoyer
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-sm text-gray-500 hover:underline">
              ← Retour à la connexion
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/auth/register" className="text-primary-600 font-medium hover:underline">
            Créer un espace
          </Link>
        </p>
      </div>
    </div>
  )
}