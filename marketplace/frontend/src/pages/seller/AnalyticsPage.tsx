import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Phone, MessageCircle, Package, Loader2, AlertCircle, BarChart3 } from 'lucide-react'
import { adminService } from '@/services/adminService'
import { productService } from '@/services/productService'
import type { SellerAnalyticsProduct } from '@/types/admin'

function DailyViewsChart({ daily }: { daily: { date: string; count: number }[] }) {
  const rows = [...daily].reverse()
  const max = Math.max(1, ...rows.map((d) => d.count))
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">Pas encore de vues enregistrées.</p>
  }
  return (
    <div className="flex items-end gap-1 h-28">
      {rows.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full bg-primary-500 rounded-t transition-all group-hover:bg-primary-400"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
          <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 absolute -top-5 bg-gray-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
            {d.date.slice(5)} : {d.count}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function SellerAnalyticsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: async () => (await adminService.getSellerAnalytics()).data,
  })

  const { data: productDetail } = useQuery({
    queryKey: ['product-analytics', selectedId],
    queryFn: async () => (await productService.getProductAnalytics(selectedId!)).data,
    enabled: !!selectedId,
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
    { label: 'Produits', value: data.product_count, icon: Package, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
    { label: 'Appels reçus', value: data.total_phone_contacts, icon: Phone, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
    { label: 'Messages WhatsApp', value: data.total_whatsapp_contacts, icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
          Statistiques
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vues et contacts de vos annonces. Cliquez sur un produit pour voir le détail sur 30 jours.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Product drill-down */}
      {selectedId && productDetail && (
        <div className="card p-6 mb-8 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-primary-600" />
              {productDetail.title}
            </h2>
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Fermer
            </button>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {productDetail.total_views.toLocaleString('fr-FR')} vues au total · 30 derniers jours
          </div>
          <DailyViewsChart daily={productDetail.daily_views} />
        </div>
      )}

      {/* Per-product table */}
      {data.products.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-2" />
          Aucun produit publié pour le moment.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Produit</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vues</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Appels</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p: SellerAnalyticsProduct) => (
                <tr
                  key={p.product_id}
                  onClick={() => setSelectedId(p.product_id)}
                  className={`border-b border-gray-50 dark:border-gray-800/50 last:border-0 cursor-pointer transition-colors ${
                    selectedId === p.product_id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white truncate">
                    {p.title}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {p.total_views}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                    {p.phone_contacts}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    {p.whatsapp_contacts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}