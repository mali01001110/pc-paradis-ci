import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  EyeOff,
  RotateCcw,
  RefreshCw,
  Loader2,
  AlertCircle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { ModerationProduct } from '@/types/admin'
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/types/admin'
import { formatPrice } from '@/services/productService'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Tous', value: '' },
  { label: 'En attente', value: 'PENDING_REVIEW' },
  { label: 'Rejetés', value: 'REJECTED' },
  { label: 'Masqués', value: 'HIDDEN' },
  { label: 'En ligne', value: 'AVAILABLE' },
]

function StatusBadge({ status }: { status: ProductStatus }) {
  const styles: Record<ProductStatus, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    SOLD: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    HIDDEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    PENDING_REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant,
  loading,
}: {
  label: string
  icon: typeof CheckCircle
  onClick: () => void
  variant: 'approve' | 'reject' | 'hide' | 'restore'
  loading: boolean
}) {
  const classes = {
    approve: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30',
    reject: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30',
    hide: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
    restore: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30',
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${classes[variant]}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      {label}
    </button>
  )
}

export default function ModerationQueuePage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [moderateLoading, setModerateLoading] = useState<string | null>(null)

  const { data: queueData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-moderation', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page) }
      if (statusFilter) params.status = statusFilter
      const res = await adminService.getModerationQueue(params)
      return res.data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await adminService.getAdminStats()).data,
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      setModerateLoading(id)
      return adminService.moderateProduct(id, { action: action as 'approve' | 'reject' | 'hide' | 'restore' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onSettled: () => setModerateLoading(null),
  })

  const totalPages = Math.ceil((queueData?.count ?? 0) / 20)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Modération produits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Examinez et modérez les annonces de la marketplace.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Stats bar */}
      {statsData && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: statsData.total_products, color: 'text-gray-600 dark:text-gray-300' },
            { label: 'En ligne', value: statsData.available, color: 'text-green-600' },
            { label: 'En attente', value: statsData.pending_review, color: 'text-orange-600' },
            { label: 'Rejetés', value: statsData.rejected, color: 'text-red-600' },
            { label: 'Masqués', value: statsData.hidden, color: 'text-yellow-600' },
            { label: 'Supprimés', value: statsData.deleted, color: 'text-gray-500' },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <div className={`text-xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-20 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 py-20 text-red-500">
          <AlertCircle size={18} /> Erreur de chargement.
        </div>
      ) : queueData?.results.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
          Aucun produit à modérer pour ce filtre.
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Produit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Vendeur</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Prix</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueData?.results.map((p: ModerationProduct) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]?.image ? (
                          <img
                            src={p.images[0].image}
                            alt={p.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={14} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/products/${p.category?.slug ?? 'cat'}/${p.slug}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block"
                          >
                            {p.title}
                          </Link>
                          <div className="text-xs text-gray-400 truncate">
                            {p.category?.name} · {p.brand?.name ?? '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="text-gray-700 dark:text-gray-300">{p.seller?.business_name || p.seller?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(p.price)} <span className="text-xs text-gray-400">FCFA</span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {moderateLoading === p.id ? (
                          <Loader2 size={14} className="animate-spin text-gray-400" />
                        ) : (
                          <>
                            {p.status === 'PENDING_REVIEW' && (
                              <>
                                <ActionButton label="Approuver" icon={CheckCircle} variant="approve" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'approve' })} />
                                <ActionButton label="Rejeter" icon={XCircle} variant="reject" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'reject' })} />
                                <ActionButton label="Masquer" icon={EyeOff} variant="hide" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'hide' })} />
                              </>
                            )}
                            {p.status === 'REJECTED' && (
                              <ActionButton label="Réactiver" icon={RotateCcw} variant="restore" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'restore' })} />
                            )}
                            {p.status === 'HIDDEN' && (
                              <ActionButton label="Rétablir" icon={RotateCcw} variant="restore" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'restore' })} />
                            )}
                            {p.status === 'AVAILABLE' && (
                              <ActionButton label="Masquer" icon={EyeOff} variant="hide" loading={false} onClick={() => moderateMutation.mutate({ id: p.id, action: 'hide' })} />
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {queueData?.count} produit{queueData?.count !== 1 ? 's' : ''} au total
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300">
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}