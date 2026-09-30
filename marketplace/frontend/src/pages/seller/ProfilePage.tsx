import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Check, Save, Upload } from 'lucide-react'
import { authService, getErrorMessage } from '@/services/api'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'

const CITIES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Daloa', 'Bingerville', 'Autre']
const COMMUNES = ['Cocody', 'Yopougon', 'Marcory', 'Treichville', 'Plateau', 'Port-Bouët', 'Abobo', 'Adjamé', 'Koumassi', 'Bingerville']

interface ProfileForm {
  first_name: string
  last_name: string
  business_name: string
  phone: string
  whatsapp: string
  description: string
  city: string
  commune: string
  location: string
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data: seller, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await authService.getMe()).data,
  })

  useEffect(() => {
    if (seller && !form) {
      setForm({
        first_name: seller.first_name ?? '',
        last_name: seller.last_name ?? '',
        business_name: seller.business_name ?? '',
        phone: seller.phone ?? '',
        whatsapp: seller.whatsapp ?? '',
        description: seller.profile?.description ?? '',
        city: seller.profile?.city ?? 'Abidjan',
        commune: seller.profile?.commune ?? '',
        location: seller.profile?.location ?? '',
      })
    }
  }, [seller, form])

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      authService.updateMe({
        first_name: data.first_name,
        last_name: data.last_name,
        business_name: data.business_name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        profile: {
          description: data.description,
          city: data.city,
          commune: data.commune,
          location: data.location,
        },
      }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form) updateMutation.mutate(form)
  }

  const imageMutation = useMutation({
    mutationFn: ({ field, file }: { field: 'logo' | 'photo'; file: File }) =>
      authService.uploadProfileImage(field, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Image mise à jour.')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleImageChange = (field: 'logo' | 'photo', file: File | undefined) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 Mo).')
      return
    }
    imageMutation.mutate({ field, file })
  }

  if (isLoading || !form) {
    return <div className="p-8 text-gray-400">Chargement…</div>
  }

  const set = (patch: Partial<ProfileForm>) => setForm({ ...form, ...patch })

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Mon profil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ces informations sont visibles par les acheteurs sur vos annonces et votre boutique.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Logo & photo (spec §9) */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Logo &amp; photo</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex items-center gap-4 flex-1">
            {seller?.profile?.logo ? (
              <img src={seller.profile.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <Avatar name={form.business_name} size="lg" />
            )}
            <div>
              <label htmlFor="profile-logo" className="btn-secondary inline-flex items-center gap-2 text-sm cursor-pointer">
                <Upload size={14} /> {imageMutation.isPending && imageMutation.variables?.field === 'logo' ? 'Envoi…' : 'Changer le logo'}
              </label>
              <input
                id="profile-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => handleImageChange('logo', e.target.files?.[0])}
              />
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG ou WebP — max 2 Mo</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1">
            {seller?.profile?.photo ? (
              <img src={seller.profile.photo} alt="Photo" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <Avatar name={seller?.first_name ?? '?'} size="lg" />
            )}
            <div>
              <label htmlFor="profile-photo" className="btn-secondary inline-flex items-center gap-2 text-sm cursor-pointer">
                <Upload size={14} /> {imageMutation.isPending && imageMutation.variables?.field === 'photo' ? 'Envoi…' : 'Changer la photo'}
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => handleImageChange('photo', e.target.files?.[0])}
              />
              <p className="text-xs text-gray-400 mt-1.5">Visible sur vos annonces</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Identité</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
              <input value={form.first_name} onChange={(e) => set({ first_name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
              <input value={form.last_name} onChange={(e) => set({ last_name: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom commercial</label>
            <input value={form.business_name} onChange={(e) => set({ business_name: e.target.value })} className="input-field" placeholder="TechStore Abidjan" />
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} className="input-field" placeholder="+2250708091011" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} className="input-field" placeholder="+2250708091011" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Localisation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
              <select value={form.city} onChange={(e) => set({ city: e.target.value })} className="input-field">
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commune</label>
              <select value={form.commune} onChange={(e) => set({ commune: e.target.value })} className="input-field">
                <option value="">--</option>
                {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localisation générale</label>
            <input value={form.location} onChange={(e) => set({ location: e.target.value })} className="input-field" placeholder="Ex: Près de la pharmacie, Riviera 3" />
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Description</h2>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            maxLength={1000}
            className="input-field resize-none"
            placeholder="Présentez votre activité : spécialités, garanties, zones de livraison…"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary px-8 inline-flex items-center gap-2" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              'Enregistrement…'
            ) : saved ? (
              <><Check size={16} /> Enregistré</>
            ) : (
              <><Save size={16} /> Enregistrer</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
