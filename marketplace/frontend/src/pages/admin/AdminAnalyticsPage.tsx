import { useQuery } from '@tanstack/react-query'
import {
  Eye,
  Package,
  Users,
  Store,
  Tags,
  Phone,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { adminService } from '@/services/adminService'

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await adminService.getAdminAnalytics()).data,
  })

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> Chargement…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8 flex items-center gap-2 text-red-500">
        <AlertCircle size={18} /> Erreur de chargement des statistiques.
      </div>
    )
  }

  const statCards = [
    { label: 'Vues totales', value: data.total_views, icon: Eye, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Produits', value: data.total_products, icon: Package, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
    { label: 'Vendeurs', value: data.total_sellers, icon: Users, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
    { label: 'Boutiques', value: data.total_shops, icon: Store, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
    { label: 'Catégories', value: data.total_categories, icon: Tags, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Contacts reçus', value: data.total_contacts, icon: Phone, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  ]

  const maxCategoryViews = Math.max(1, ...data.by_category.map((c) => c.views))
  const maxSearchCount = Math.max(1, ...data.top_searches.map((s) => s.search_count))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
          Statistiques de la marketplace
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vue d'ensemble de l'activité de la plateforme.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                {card.value.toLocaleString('fr-FR')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By category */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Vues par catégorie
          </h2>
          {data.by_category.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {data.by_category.slice(0, 10).map((c) => (
                <div key={c.category__slug}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {c.category__name}
                      <span className="text-xs text-gray-400 ml-2">({c.products} produits)</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-4">
                      {c.views.toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(c.views / maxCategoryViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top searches */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            Recherches populaires
          </h2>
          {data.top_searches.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune recherche enregistrée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {data.top_searches.map((s) => (
                <div key={s.query}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 truncate font-mono text-xs">
                      {s.query}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-4">
                      {s.search_count}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(s.search_count / maxSearchCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}