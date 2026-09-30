import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { ProductReport } from '@/types/admin'
import { REPORT_REASON_LABELS } from '@/types/admin'

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  REVIEWED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  DISMISSED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  REVIEWED: 'Traité',
  DISMISSED: 'Rejeté',
}

const REASON_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Fraude', value: 'FRAUD' },
  { label: 'Produit interdit', value: 'PROHIBITED' },
  { label: 'Spam', value: 'SPAM' },
  { label: 'Inapproprié', value: 'INAPPROPRIATE' },
]

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-reports', statusFilter, reasonFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (reasonFilter) params.reason = reasonFilter
      const res = await adminService.getReports(params)
      return res.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'REVIEWED' | 'DISMISSED' }) => {
      setActionLoading(id)
      return adminService.updateReport(id, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
    onSettled: () => setActionLoading(null),
  })

  const reports: ProductReport[] = data?.results ?? []
  const openCount = reports.filter((r) => r.status === 'OPEN').length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Signalements
            {openCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {openCount} ouvert{openCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Traitez les signalements envoyés par les visiteurs.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {['', 'OPEN', 'REVIEWED', 'DISMISSED'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s ? STATUS_LABELS[s] : 'Tous'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap sm:ml-auto">
          {REASON_TABS.map((r) => (
            <button
              key={r.value || 'all'}
              onClick={() => setReasonFilter(r.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                reasonFilter === r.value
                  ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-20 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 py-20 text-red-500">
          <AlertCircle size={18} /> Erreur de chargement.
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
          Aucun signalement à traiter.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle size={11} />
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Link
                    to={`/products/${r.product_category_slug ?? 'cat'}/${r.product_slug}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary-600"
                  >
                    {r.product_title}
                  </Link>
                  {r.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.description}</p>
                  )}
                  {r.reporter_email && (
                    <p className="text-xs text-gray-400 mt-1">Signalé par : {r.reporter_email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {actionLoading === r.id ? (
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      {r.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => updateMutation.mutate({ id: r.id, status: 'REVIEWED' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                          >
                            <CheckCircle size={12} /> Traiter
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: r.id, status: 'DISMISSED' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <XCircle size={12} /> Ignorer
                          </button>
                        </>
                      )}
                      {r.status !== 'OPEN' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: r.id, status: 'OPEN' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <RotateCcw size={12} /> Rouvrir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}