import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { Price } from '@/components/ui/Price'
import { MessageCircle } from 'lucide-react'
import type { Product } from '@/types/product'
import { normalizePhone } from '@/lib/phone'
import { productService } from '@/services/productService'
import { cn } from '@/lib/utils'

const COND_VARIANTS: Record<Product['condition'], BadgeProps['variant']> = {
  NEUF: 'success',
  OCCASION: 'warning',
  RECONDITIONNE: 'info',
  UTILISE: 'neutral',
}

const WA_MESSAGE = (title: string) =>
  `Bonjour, je suis intéressé par votre annonce "${title}" publiée sur PC Paradis CI.`

interface Props {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: Props) {
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const src = primaryImage?.image ?? product.image
  const phone = product.phone
  const whatsapp = product.whatsapp || product.phone
  const waHref =
    whatsapp && whatsapp.trim()
      ? `https://wa.me/${normalizePhone(whatsapp).replace('+', '')}?text=${encodeURIComponent(WA_MESSAGE(product.title))}`
      : null

  return (
    <div className={cn('card group overflow-hidden hover:shadow-glow transition-all duration-200 flex flex-col', className)}>
      <Link to={`/products/${product.category_slug ?? 'cat'}/${product.slug}`} className="block">
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
        <div className="p-3 pb-2">
          {product.brand_name && (
            <div className="text-xs text-gray-400 mb-0.5">{product.brand_name}</div>
          )}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.title}
          </h3>
          <Price
            value={product.price}
            currency={product.currency}
            fcfa={product.price_fcfa}
            className="text-base text-primary-600 dark:text-primary-400 font-display mb-2"
          />
          <div className="flex items-center justify-between">
            <Badge variant={COND_VARIANTS[product.condition] ?? 'neutral'}>
              {product.condition_display ?? product.condition}
            </Badge>
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
      {(phone?.trim() || waHref) && (
        <div className="px-3 pb-3 mt-auto flex items-center gap-2">
          {phone?.trim() && (
            <a
              href={`tel:${normalizePhone(phone)}`}
              onClick={() => void productService.logContact(product.slug, 'PHONE').catch(() => {})}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Phone size={12} /> Appeler
            </a>
          )}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void productService.logContact(product.slug, 'WHATSAPP').catch(() => {})}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  )
}
