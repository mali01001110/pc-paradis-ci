import { useState } from 'react'
import { useLang } from '@/i18n'
import { useCurrency } from '@/hooks/useCurrency'
import { useAuth } from '@/hooks/useAuth'
import { Globe, CreditCard, User, Shield, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { lang, setLang } = useLang()
  const { currency, setCurrency } = useCurrency()
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

        {/* Language */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Langue</h2>
          </div>
          <div className="flex gap-3">
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  lang === l
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                }`}
              >
                {l === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Devise d&apos;affichage</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['FCFA', 'EUR', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  currency === c
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                }`}
              >
                {c === 'FCFA' ? 'FCFA' : c === 'EUR' ? 'EUR (€)' : 'USD ($)'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Les prix sont stockés en FCFA et convertis pour affichage.
          </p>
        </div>
      </div>
    </div>
  )
}
