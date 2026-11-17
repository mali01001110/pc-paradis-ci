import { useAuth } from '@/hooks/useAuth'
import { User, Shield, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { seller } = useAuth()

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
          Paramètres
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Préférences de votre compte et de la plateforme.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Compte</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-gray-900 dark:text-white">{seller?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Boutique</span>
              <span className="text-gray-900 dark:text-white">{seller?.business_name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Statut</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle size={13} className="text-green-500" />
                <span className="text-gray-900 dark:text-white capitalize">{seller?.status?.toLowerCase() ?? '—'}</span>
              </span>
            </div>
            {seller?.mfa_enabled && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">MFA</span>
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Shield size={13} /> Active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
