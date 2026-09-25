import { Link } from 'react-router-dom'
import { Eye, MapPin } from 'lucide-react'
import type { Product } from '@/types/product'
import { formatPrice } from '@/services/productService'

const COND_STYLES: Record<string, string> = {
  NEUF: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  OCCASION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  RECONDITIONNE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  UTILISE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

interface Props {
  product: Product
  className?: string
}

export default function ProductCard({ product, className = '' }: Props) {
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const src = primaryImage?.image ?? product.image
  const cond = COND_STYLES[product.condition] ?? ''

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`card group overflow-hidden hover:shadow-glow transition-all duration-200 ${className}`}
    >
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 dark:text-gray-600 text-sm">Pas de photo</span>
          </div>
        )}
      </div>
      <div className="p-3">
        {product.brand_name && (
          <div className="text-xs text-gray-400 mb-0.5">{product.brand_name}</div>
        )}
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.title}
        </h3>
        <div className="text-base font-bold text-primary-600 dark:text-primary-400 mb-2 font-display">
          {formatPrice(product.price)} <span className="text-xs font-normal text-gray-400">FCFA</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cond}`}>
            {product.condition_display ?? product.condition}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {product.city && (
              <span className="flex items-center gap-0.5">
                <MapPin size={11} /> {product.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
