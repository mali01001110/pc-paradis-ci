import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authService, getErrorMessage } from '@/services/api'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    authService
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(getErrorMessage(err))
      })
  }, [token])

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="mx-auto text-primary-600 mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vérification en cours…</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Veuillez patienter.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={56} className="mx-auto text-green-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email confirmé !</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Votre compte est activé. Vous pouvez maintenant vous connecter.
            </p>
            <button onClick={() => navigate('/auth/login')} className="btn-primary px-8 py-3">
              Se connecter
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={56} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lien invalide</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Ce lien est expiré ou a déjà été utilisé.
            </p>
            <p className="text-red-500 text-sm mb-6">{error}</p>
            <button onClick={() => navigate('/auth/login')} className="btn-primary px-8 py-3">
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  )
}