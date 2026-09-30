import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  UserX,
  Ban,
  RotateCcw,
  Search,
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { SellerListItem } from '@/types/admin'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  BANNED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  SUSPENDED: 'Suspendu',
  BANNED: 'Banni',
}

export default function SellersManagementPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-sellers', statusFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await adminService.getSellers(params)
      return res.data
    },
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'suspend' | 'ban' | 'unsuspend' }) => {
      setActionLoading(id)
      return adminService.moderateSeller(id, { action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] })
    },
    onSettled: () => setActionLoading(null),
  })

  const sellers: SellerListItem[] = data?.results ?? []

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Gestion des vendeurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suspendez, bannissez ou réactivez les comptes vendeurs.
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email, nom, boutique…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          {['', 'ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'].map((s) => (
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
      ) : sellers.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <UserX size={32} className="mx-auto mb-2" />
          Aucun vendeur trouvé.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Vendeur</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Localisation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Produits</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {s.business_name || `${s.first_name} ${s.last_name}`.trim()}
                    </div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {[s.commune, s.city].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.product_count}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_STYLES[s.status]}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      {s.email_verified && (
                        <span className="text-[10px] text-green-600 dark:text-green-400">Email vérifié</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {actionLoading === s.id ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          {(s.status === 'ACTIVE' || s.status === 'PENDING') && (
                            <button
                              onClick={() => moderateMutation.mutate({ id: s.id, action: 'suspend' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                            >
                              <UserX size={12} /> Suspendre
                            </button>
                          )}
                          {(s.status === 'ACTIVE' || s.status === 'PENDING' || s.status === 'SUSPENDED') && (
                            <button
                              onClick={() => moderateMutation.mutate({ id: s.id, action: 'ban' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Ban size={12} /> Bannir
                            </button>
                          )}
                          {(s.status === 'SUSPENDED' || s.status === 'BANNED') && (
                            <button
                              onClick={() => moderateMutation.mutate({ id: s.id, action: 'unsuspend' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <RotateCcw size={12} /> Réactiver
                            </button>
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
      )}
    </div>
  )
}