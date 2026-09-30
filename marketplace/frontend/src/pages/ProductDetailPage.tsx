import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Eye, Package,
  Pencil,
} from 'lucide-react'
import { productService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useSEO } from '@/hooks/useSEO'
import { useT } from '@/i18n'
import { useToast } from '@/components/ui/Toast'
import { useProductRow } from '@/hooks/useProductRow'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { Price } from '@/components/ui/Price'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { SellerCard } from '@/components/SellerCard'
import { normalizePhone } from '@/lib/phone'
import { ProductRow, ProductRowSlide } from '@/components/ProductRow'
import ProductCard from '@/components/ProductCard'
import { ReportProductDialog } from '@/components/ReportProductDialog'
import type { Product } from '@/types/product'

const COND_VARIANTS: Record<Product['condition'], BadgeProps['variant']> = {
  NEUF: 'success',
  OCCASION: 'warning',
  RECONDITIONNE: 'info',
  UTILISE: 'neutral',
}

function formatAttrValue(value: unknown, t: (k: string) => string): string {
  if (value === true) return t('product.yes')
  if (value === false) return t('product.no')
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function ProductDetailPage() {
  const { categorySlug, productSlug, slug } = useParams<{
    categorySlug: string
    productSlug: string
    slug: string
  }>()
  const slugToUse = productSlug ?? slug
  const { seller: me } = useAuth()
  const { t } = useT()
  const toast = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slugToUse],
    queryFn: async () => (await productService.getProduct(slugToUse!)).data,
    enabled: !!slugToUse,
    retry: false,
  })

  const contactMutation = useMutation({
    mutationFn: (contactType: 'PHONE' | 'WHATSAPP') =>
      productService.logContact(slugToUse!, contactType),
    onError: () => toast.error(t('product.contactError')),
  })

  const handleWhatsAppClick = () => {
    contactMutation.mutate('WHATSAPP')
    if (data) {
      const waUrl = `https://wa.me/${normalizePhone(data.whatsapp || data.phone).replace('+', '')}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé par votre annonce "${data.title}" publiée sur PC Paradis CI.`
      )}`
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const product: Product | undefined = data
  const images = product?.images ?? []
  const isSold = product?.status === 'SOLD'

  useSEO({
    title: product
      ? `${product.title} — ${product.price.toLocaleString('fr-FR')} ${product.currency} | PC Paradis CI`
      : 'PC Paradis CI',
    description: product
      ? product.description?.slice(0, 155) ||
        `${product.title} ${product.condition_display} ${product.brand_name ?? ''} à ${product.city || 'Abidjan'} sur PC Paradis CI.`
      : 'Annonces PC Hardware & Gaming à Abidjan, Côte d’Ivoire.',
    url: window.location.href,
    image: images[0]?.image ?? product?.image ?? null,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          sku: product.slug,
          image: images.map((img) => img.image).filter(Boolean),
          description: product.description || undefined,
          brand: product.brand_name ? { '@type': 'Brand', name: product.brand_name } : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: product.currency,
            price: product.price,
            itemCondition:
              product.condition === 'NEUF'
                ? 'https://schema.org/NewCondition'
                : 'https://schema.org/UsedCondition',
            availability: product.status === 'SOLD' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          },
        }
      : null,
  })

  useEffect(() => {
    if (!product) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'json-ld-breadcrumb'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: window.location.origin },
        {
          '@type': 'ListItem',
          position: 2,
          name: product.category_name ?? 'Produits',
          item: `${window.location.origin}/products?cat=${product.category_slug ?? ''}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.title,
          item: window.location.href,
        },
      ],
    })
    document.head.appendChild(script)
    return () => {
      document.getElementById('json-ld-breadcrumb')?.remove()
    }
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">{t('product.loading')}</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package size={56} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('product.notFound')}</h1>
        <p className="text-gray-500 text-sm mb-6">{getErrorMessage(error)}</p>
        <Link to="/" className="btn-primary px-6">{t('product.backHome')}</Link>
      </div>
    )
  }

  const p: Product = product
  const isOwner = !!me?.id && me.id === p.seller_id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white mb-6 text-sm"
      >
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Images + description */}
        <div className="lg:col-span-3">
          <ImageGallery images={images.map((img) => ({ id: img.id, image: img.image }))} alt={p.title} />

          {(p.description || p.model) && (
            <div className="mt-8">
              {p.model && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('product.model')}</span>
                  <div className="text-gray-900 dark:text-white mt-0.5">{p.model}</div>
                </div>
              )}
              {p.description && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('product.description')}</span>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {p.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Info + contact */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            {p.brand_name && <div className="text-sm text-gray-400 mb-1">{p.brand_name}</div>}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display leading-tight mb-3">
              {p.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <Badge variant={COND_VARIANTS[p.condition] ?? 'neutral'}>{p.condition_display}</Badge>
              <span className="flex items-center gap-1 text-gray-400">
                <Eye size={13} /> {p.views_count} {t('product.views')}
              </span>
              {p.city && (
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin size={13} /> {p.city}{p.commune ? `, ${p.commune}` : ''}
                </span>
              )}
            </div>
          </div>

          {isSold && (
            <div className="rounded-card bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">
              {t('product.soldBanner')}
            </div>
          )}

          {/* Price + contact */}
          <div className="card p-5">
            <Price
              value={p.price}
              currency={p.currency}
              fcfa={p.price_fcfa}
              className="text-3xl text-primary-600 dark:text-primary-400 font-display block mb-4"
            />

            {isOwner ? (
              <div className="space-y-3">
                <Link
                  to={`/seller/products/${p.id}/edit`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Pencil size={16} /> {t('product.editListing')}
                </Link>
                <p className="text-xs text-center text-gray-400">{t('product.owner')}</p>
              </div>
            ) : isSold ? (
              <p className="text-sm text-center text-gray-400">{t('product.soldBanner')}</p>
            ) : (
              <div className="space-y-3">
                {p.phone && (
                  <a
                    href={`tel:${normalizePhone(p.phone)}`}
                    onClick={() => contactMutation.mutate('PHONE')}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Phone size={16} /> {t('product.call')} {p.phone}
                  </a>
                )}
                {(p.whatsapp || p.phone) && (
                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageCircle size={16} />
                    {t('product.whatsapp')} {p.whatsapp || p.phone}
                  </button>
                )}
                {!p.phone && !p.whatsapp && (
                  <p className="text-sm text-center text-gray-400">{t('product.noContact')}</p>
                )}
              </div>
            )}
          </div>

          {/* Dynamic attributes */}
          {p.attributes && p.attributes.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('product.characteristics')}
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {p.attributes.map((attr) => (
                  <div key={attr.id} className="contents">
                    <dt className="text-gray-500 dark:text-gray-400">{attr.label}</dt>
                    <dd className="text-gray-900 dark:text-white font-medium text-right">
                      {formatAttrValue(attr.value, t)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Seller card */}
          {p.seller_name && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                {t('product.seller')}
              </h2>
              <SellerCard
                name={p.seller_name}
                city={p.city}
                whatsapp={p.whatsapp}
                phone={p.phone}
              />
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 text-center space-y-3">
            <div>
              {t('product.publishedOn')} {new Date(p.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
            <div className="flex justify-center">
              <ReportProductDialog productSlug={p.slug} />
            </div>
          </div>
        </div>
      </div>

      <SimilarProducts categorySlug={p.category_slug} excludeId={p.id} />
    </div>
  )
}

/* Similar products from the same category (hidden when empty). */
function SimilarProducts({ categorySlug, excludeId }: { categorySlug?: string; excludeId?: string }) {
  const { t } = useT()
  const { data, isLoading } = useProductRow({
    category: categorySlug,
    ordering: '-created_at',
    pageSize: 12,
  })

  if (isLoading) return null

  const similar = (data?.results ?? []).filter((prod) => prod.id !== excludeId).slice(0, 10)
  if (similar.length === 0) return null

  return (
    <ProductRow title={t('product.similarProducts')} className="mt-12">
      {similar.map((prod) => (
        <ProductRowSlide key={prod.id}>
          <ProductCard product={prod} />
        </ProductRowSlide>
      ))}
    </ProductRow>
  )
}
