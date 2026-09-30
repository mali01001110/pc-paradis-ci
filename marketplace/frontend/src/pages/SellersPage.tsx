import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Store, MapPin, Package, Loader2, AlertCircle } from 'lucide-react'
import { shopService } from '@/services/shopService'
import { Avatar } from '@/components/ui/Avatar'
import type { PublicSeller } from '@/types/shop'
import { useT } from '@/i18n'

export default function SellersPage() {
  const { t } = useT()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-sellers'],
    queryFn: async () => (await shopService.getPublicSellers()).data,
  })

  const sellers: PublicSeller[] = data?.results ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-display">
          Nos vendeurs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
          {t('common.explore')} — découvrez les boutiques de matériel PC & gaming en Côte d'Ivoire.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Chargement…
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center gap-2 py-20 text-red-500">
          <AlertCircle size={20} /> Erreur de chargement.
        </div>
      ) : sellers.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Store size={40} className="mx-auto mb-3" />
          Aucun vendeur pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellers.map((seller) => {
            const name = seller.business_name || `${seller.first_name} ${seller.last_name}`.trim()
            return (
              <Link
                key={seller.id}
                to={seller.shop_slug ? `/shop/${seller.shop_slug}` : '#'}
                className="card p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar name={name} size="lg" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {name}
                    </div>
                    {seller.city && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={12} /> {seller.city}
                        {seller.commune ? `, ${seller.commune}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                    <Store size={14} />
                    {seller.shop_name || 'Boutique'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Package size={14} />
                    {seller.product_count} produit{seller.product_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}