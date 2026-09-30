import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Package } from 'lucide-react'
import { productService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { Price } from '@/components/ui/Price'
import type { Product } from '@/types/product'

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  AVAILABLE: 'success',
  SOLD: 'neutral',
  HIDDEN: 'neutral',
  PENDING_REVIEW: 'warning',
  REJECTED: 'danger',
}

export default function MyProductsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => (await productService.getMyProducts()).data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.deleteMyProduct(id),
    onSuccess: () => {
      toast.success('Produit supprimé.')
      setPendingDelete(null)
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const confirmDelete = () => {
    if (pendingDelete) deleteMutation.mutate(pendingDelete.id)
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
                  <Badge variant={STATUS_VARIANTS[product.status] ?? 'neutral'}>
                    {product.status_display}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                  <Price value={product.price} className="text-primary-600 dark:text-primary-400" />
                  <span>{product.condition_display}</span>
                  {product.brand_name && <span>{product.brand_name}</span>}
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
                  onClick={() => setPendingDelete(product)}
                  className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-3 py-2 transition-colors inline-flex items-center gap-1.5"
                >
                  <Trash2 size={15} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation de suppression */}
      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <DialogContent
          title="Supprimer le produit"
          description={`« ${pendingDelete?.title ?? ''} » sera retiré de la vente. Cette action est irréversible.`}
        >
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              <Trash2 size={15} /> Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
