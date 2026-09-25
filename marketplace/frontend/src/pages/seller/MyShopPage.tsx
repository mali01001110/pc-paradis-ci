import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Store, Check, ExternalLink } from 'lucide-react'
import { shopService } from '@/services/shopService'
import { getErrorMessage } from '@/services/api'
import type { ShopUpdatePayload } from '@/types/shop'

const CITIES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Daloa', 'Bingerville', 'Autre']
const COMMUNES = ['Cocody', 'Yopougon', 'Marcory', 'Treichville', 'Plateau', 'Port-Bouët', 'Abobo', 'Adjamé', 'Koumassi', 'Bingerville']

export default function MyShopPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ShopUpdatePayload>({})
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const { data: shop, isLoading } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => (await shopService.getMyShop()).data,
  })

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name,
        description: shop.description,
        phone: shop.phone,
        whatsapp: shop.whatsapp,
        city: shop.city,
        commune: shop.commune,
        location: shop.location,
      })
    }
  }, [shop])

  const updateMutation = useMutation({
    mutationFn: (data: ShopUpdatePayload) => shopService.updateMyShop(data),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      queryClient.invalidateQueries({ queryKey: ['my-shop'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate(form)
  }

  if (isLoading) {
    return <div className="p-8 text-gray-400">Chargement…</div>
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Ma boutique</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ces informations sont visibles publiquement sur /shop/{shop?.slug}
          </p>
        </div>
        {shop?.slug && (
          <a
            href={`/shop/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            Voir la page publique <ExternalLink size={14} />
          </a>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la boutique</label>
          <div className="relative">
            <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field pl-10"
              placeholder="TechStore Abidjan"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="input-field resize-none"
            placeholder="Spécialiste GPU, garanties, livraison à Abidjan…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
            <input
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="+2250708091011"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
            <input
              value={form.whatsapp ?? ''}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="input-field"
              placeholder="+2250708091011"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
            <input
              value={form.city ?? ''}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input-field"
              placeholder="Abidjan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commune</label>
            <input
              value={form.commune ?? ''}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
              className="input-field"
              placeholder="Cocody"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localisation générale</label>
          <input
            value={form.location ?? ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="input-field"
            placeholder="Ex: Près de la pharmacie, Riviera 3"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="btn-primary px-8" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Enregistrement…' : saved ? <><Check size={16} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}