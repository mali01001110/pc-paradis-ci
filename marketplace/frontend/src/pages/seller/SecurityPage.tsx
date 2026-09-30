import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, ShieldCheck, ShieldOff, Check } from 'lucide-react'
import { authService, getErrorMessage } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

export default function SecurityPage() {
  const { seller } = useAuth()
  const queryClient = useQueryClient()

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // MFA
  const [mfaPassword, setMfaPassword] = useState('')
  const [mfaError, setMfaError] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authService.changePassword({ current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      setPwMessage({ type: 'success', text: 'Mot de passe changé.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => setPwMessage({ type: 'error', text: getErrorMessage(err) }),
  })

  const enableMFAMutation = useMutation({
    mutationFn: () => authService.enableMFA(mfaPassword),
    onSuccess: () => {
      setMfaPassword('')
      setMfaError('')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => setMfaError(getErrorMessage(err)),
  })

  const disableMFAMutation = useMutation({
    mutationFn: () => authService.disableMFA(mfaPassword),
    onSuccess: () => {
      setMfaPassword('')
      setMfaError('')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => setMfaError(getErrorMessage(err)),
  })

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    setPwMessage(null)
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    changePasswordMutation.mutate()
  }

  const handleMFA = () => {
    setMfaError('')
    if (seller?.mfa_enabled) disableMFAMutation.mutate()
    else enableMFAMutation.mutate()
  }

  const mfaBusy = enableMFAMutation.isPending || disableMFAMutation.isPending

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Sécurité</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gérez votre mot de passe et l&apos;authentification à deux facteurs.
        </p>
      </div>

      <div className="space-y-6">
        {/* Change password */}
        <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h2>
          </div>

          {pwMessage && (
            <div className={`rounded-lg p-3 text-sm ${pwMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
              {pwMessage.text}
            </div>
          )}

          <div>
            <label htmlFor="pw-current" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <input id="pw-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pw-new" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
              <input id="pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="Au moins 8 caractères" />
            </div>
            <div>
              <label htmlFor="pw-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmation</label>
              <input id="pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Confirmez" />
            </div>
          </div>
          <button type="submit" className="btn-primary px-8" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? 'Modification…' : 'Changer le mot de passe'}
          </button>
        </form>

        {/* MFA */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {seller?.mfa_enabled ? <ShieldCheck size={18} className="text-green-500" /> : <ShieldOff size={18} className="text-yellow-500" />}
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Authentification à deux facteurs</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {seller?.mfa_enabled
                    ? 'Activée : un code est envoyé par email à chaque connexion.'
                    : 'Désactivée : renforcez la sécurité de votre compte.'}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${seller?.mfa_enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
              {seller?.mfa_enabled ? 'Activée' : 'Désactivée'}
            </span>
          </div>

          {mfaError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              {mfaError}
            </div>
          )}

          <div>
            <label htmlFor="mfa-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe pour confirmer
            </label>
            <div className="flex items-center gap-3">
              <input id="mfa-password" type="password" value={mfaPassword} onChange={(e) => setMfaPassword(e.target.value)} className="input-field flex-1" placeholder="Votre mot de passe actuel" />
              <button
                type="button"
                onClick={handleMFA}
                disabled={mfaBusy || !mfaPassword}
                className={seller?.mfa_enabled ? 'btn-secondary inline-flex items-center gap-2' : 'btn-primary inline-flex items-center gap-2'}
              >
                {seller?.mfa_enabled ? <><ShieldOff size={15} /> Désactiver</> : <><Check size={15} /> Activer</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
