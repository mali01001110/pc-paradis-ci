import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Eye, Pencil, Trash2, Package, ImageOff } from 'lucide-react'
import { productService, formatPrice } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import type { Product } from '@/types/product'

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  SOLD: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  HIDDEN: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export default function MyProductsPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => (await productService.getMyProducts()).data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteMyProduct(id),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce produit ? Cette action est irreversible.')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-gray-400">Chargement...</div>
  }

  const products = data?.results ?? []

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Mes produits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data ? `${data.count} produit${data.count === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <Link to="/seller/products/new" className="btn-primary text-sm inline-flex items-center gap-2">
          <PlusCircle size={16} />
          Ajouter un produit
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">Aucun produit pour le moment.</p>
          <p className="text-sm text-gray-400 mb-6">Publiez votre premiere annonce, c&apos;est gratuit.</p>
          <Link to="/seller/products/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <PlusCircle size={16} />
            Ajouter un produit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Image */}
              <div className="w-full sm:w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {product.title}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[product.status] ?? ''}`}>
                    {product.status_display}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {formatPrice(product.price)} FCFA
                  </span>
                  <span>{product.condition_display}</span>
                  {product.brand_name && <span>{product.brand_name}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} /> {product.views_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Package size={13} /> {product.images?.length ?? 0} photo{(product.images?.length ?? 0) === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/seller/products/${product.id}/edit`}
                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                >
                  <Pencil size={14} /> Modifier
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
