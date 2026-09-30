import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { authService, getErrorMessage, type CaptchaChallenge } from '@/services/api'
import type { RegisterPayload } from '@/types/auth'

const schema = z
  .object({
    email: z.string().email('Adresse email invalide'),
    first_name: z.string().min(1, 'Prénom obligatoire'),
    last_name: z.string().min(1, 'Nom obligatoire'),
    business_name: z.string().min(1, 'Nom commercial obligatoire'),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro invalide (ex: +2250708091011)'),
    whatsapp: z.string().regex(/^\+?[0-9]{8,15}$/, 'Numéro WhatsApp invalide'),
    password: z.string().min(8, '8 caractères minimum').regex(/[A-Z]/, 'Une majuscule requise').regex(/[0-9]/, 'Un chiffre requis'),
    password2: z.string(),
    terms_accepted: z.boolean().refine((v) => v === true, 'Vous devez accepter les CGU'),
    captcha_answer: z.string().min(1, 'Réponse obligatoire'),
    website: z.string().max(0, 'Requête refusée').optional(),
  })
  .refine((d) => d.password === d.password2, { message: 'Les mots de passe ne correspondent pas', path: ['password2'] })

type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const loadCaptcha = async () => {
    try {
      const resp = await authService.getCaptchaChallenge()
      setCaptcha(resp.data)
    } catch {
      // Le formulaire restera bloqué côté serveur sans captcha valide.
      setCaptcha(null)
    }
  }

  useEffect(() => {
    void loadCaptcha()
  }, [])

  const onSubmit = async (data: Form) => {
    setGlobalError('')
    if (!captcha) {
      setGlobalError('Vérification anti-robot indisponible. Rechargez la page.')
      return
    }
    const payload: RegisterPayload = {
      email: data.email.toLowerCase(),
      first_name: data.first_name,
      last_name: data.last_name,
      business_name: data.business_name,
      phone: data.phone,
      whatsapp: data.whatsapp,
      password: data.password,
      password2: data.password2,
      terms_accepted: data.terms_accepted,
      captcha_token: captcha.token,
      captcha_answer: data.captcha_answer,
      website: data.website,
    }
    try {
      await authService.register(payload)
      window.location.href = '/auth/login?registered=true'
    } catch (err) {
      setGlobalError(getErrorMessage(err))
      void loadCaptcha()
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-[#0f0a1e]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Créer mon espace vendeur
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Gratuit. Sans commission. Sans engagement.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          {globalError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
              <input id="reg-first-name" {...register('first_name')} className="input-field" placeholder="Jean" />
              {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
              <input id="reg-last-name" {...register('last_name')} className="input-field" placeholder="Kouassi" />
              {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="reg-business-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom commercial</label>
            <input id="reg-business-name" {...register('business_name')} className="input-field" placeholder="TechStore Abidjan" />
            {errors.business_name && <p className="mt-1 text-xs text-red-500">{errors.business_name.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input id="reg-email" {...register('email')} type="email" className="input-field" placeholder="vendeur@exemple.ci" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input id="reg-phone" {...register('phone')} className="input-field" placeholder="+2250708091011" />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
              <input id="reg-whatsapp" {...register('whatsapp')} className="input-field" placeholder="+2250708091011" />
              {errors.whatsapp && <p className="mt-1 text-xs text-red-500">{errors.whatsapp.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
            <div className="relative">
              <input id="reg-password" {...register('password')} type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 8 caractères" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-password2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe</label>
            <input id="reg-password2" {...register('password2')} type={showPw ? 'text' : 'password'} className="input-field" placeholder="Confirmez" />
            {errors.password2 && <p className="mt-1 text-xs text-red-500">{errors.password2.message}</p>}
          </div>

          {/* CAPTCHA anti-robot */}
          <div>
            <label htmlFor="reg-captcha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <ShieldCheck size={14} className="inline mr-1 text-primary-600" />
              Vérification anti-robot
            </label>
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold text-lg font-display rounded-lg px-4 py-2.5 border border-primary-100 dark:border-primary-900 select-none">
                {captcha ? `${captcha.question} = ?` : '…'}
              </span>
              <input id="reg-captcha" {...register('captcha_answer')} className="input-field" placeholder="Votre réponse" inputMode="numeric" />
            </div>
            {errors.captcha_answer && <p className="mt-1 text-xs text-red-500">{errors.captcha_answer.message}</p>}
          </div>

          {/* Honeypot : champ invisible, les bots le remplissent */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input type="text" id="website" {...register('website')} tabIndex={-1} autoComplete="off" />
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" id="reg-terms" {...register('terms_accepted')} className="mt-0.5 rounded border-gray-300" />
            <label htmlFor="reg-terms" className="text-sm text-gray-600 dark:text-gray-400">
              J'accepte les{' '}
              <a href="/terms" className="text-primary-600 hover:underline">conditions d'utilisation</a>
            </label>
          </div>
          {errors.terms_accepted && <p className="text-xs text-red-500 -mt-2">{errors.terms_accepted.message}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? 'Création…' : 'Créer mon espace'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Déjà inscrit ?{' '}
          <Link to="/auth/login" className="text-primary-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}