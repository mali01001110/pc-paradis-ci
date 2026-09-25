import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft, Phone, MessageCircle, MapPin, Eye, Package,
  ExternalLink, Pencil, Loader2, Check,
} from 'lucide-react'
import { productService, formatPrice } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { useSEO } from '@/hooks/useSEO'
import type { Product } from '@/types/product'

const COND_STYLES: Record<string, string> = {
  NEUF: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  OCCASION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  RECONDITIONNE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  UTILISE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function normalizePhone(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  return `+225${digits.replace(/^0+/, '')}`
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { seller: me } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [activeImg, setActiveImg] = useState(0)
  const [contactMsg, setContactMsg] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await productService.getProduct(slug!)).data,
    enabled: !!slug,
    retry: false,
  })

  const logPhoneMutation = useMutation({
    mutationFn: () =>
      productService.logContact(slug!, 'PHONE'),
    onError: () => setContactMsg('Impossible d\'enregistrer le contact. Appelez directement.'),
  })

  const logWaMutation = useMutation({
    mutationFn: () =>
      productService.logContact(slug!, 'WHATSAPP'),
    onError: () => setContactMsg('Impossible d\'enregistrer le contact. WhatsApp direct.'),
  })

  const handlePhoneClick = () => {
    logPhoneMutation.mutate()
    setContactMsg('')
  }

  const handleWhatsAppClick = () => {
    logWaMutation.mutate()
    const product = data
    if (product) {
      const waUrl = `https://wa.me/${normalizePhone(product.whatsapp || product.phone).replace('+', '')}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé par votre annonce: ${product.title} sur PC Paradis CI.`
      )}`
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const product: Product | undefined = data
  const images = product?.images ?? []

  useSEO({
    title: product
      ? `${product.title} — ${formatPrice(product.price)} FCFA | PC Paradis CI`
      : 'PC Paradis CI',
    description: product
      ? product.description?.slice(0, 155) ||
        `${product.title} ${product.condition_display} ${product.brand_name ?? ''} à ${product.city || 'Abidjan'} sur PC Paradis CI.`
      : 'Annonces PC Hardware & Gaming à Abidjan, Côte d’Ivoire.',
    url: window.location.href,
    image: images[activeImg]?.image ?? product?.image ?? null,
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
            availability: 'https://schema.org/InStock',
          },
        }
      : null,
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package size={56} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Produit introuvable</h1>
        <p className="text-gray-500 text-sm mb-6">{getErrorMessage(error)}</p>
        <Link to="/" className="btn-primary px-6">{"Retour à l'accueil"}</Link>
      </div>
    )
  }

  const p: Product = data
  const primarySrc = images[activeImg]?.image ?? p.image ?? null
  const isOwner = me?.id === p.seller_id
  const cond = COND_STYLES[p.condition] ?? ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Images */}
        <div className="lg:col-span-3">
          {/* Main image */}
          <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-3">
            {primarySrc ? (
              <img src={primarySrc} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package size={48} />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImg
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {(p.description || p.model) && (
            <div className="mt-8">
              {p.model && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Modèle</span>
                  <div className="text-gray-900 dark:text-white mt-0.5">{p.model}</div>
                </div>
              )}
              {p.description && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</span>
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
          {/* Header */}
          <div>
            {p.brand_name && (
              <div className="text-sm text-gray-400 mb-1">{p.brand_name}</div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display leading-tight mb-3">
              {p.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${cond}`}>
                {p.condition_display}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Eye size={13} /> {p.views_count} vues
              </span>
              {p.city && (
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin size={13} /> {p.city}{p.commune ? `, ${p.commune}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="card p-5">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 font-display mb-4">
              {formatPrice(p.price)} <span className="text-base font-normal text-gray-400">FCFA</span>
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <Link
                  to={`/seller/products/${p.id}/edit`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Pencil size={16} /> Modifier cette annonce
                </Link>
                <p className="text-xs text-center text-gray-400">
                  Vous êtes le propriétaire de cette annonce.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactMsg && (
                  <div className="text-sm text-center text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2">
                    {contactMsg}
                  </div>
                )}
                {p.phone && (
                  <a
                    href={`tel:${normalizePhone(p.phone)}`}
                    onClick={handlePhoneClick}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Phone size={16} /> Appeler {p.phone}
                  </a>
                )}
                {(p.whatsapp || p.phone) && (
                  <button
                    onClick={handleWhatsAppClick}
                    disabled={logWaMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    {logWaMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    WhatsApp {p.whatsapp || p.phone}
                  </button>
                )}
                {!p.phone && !p.whatsapp && (
                  <p className="text-sm text-center text-gray-400">
                    Aucune coordonnée de contact disponible.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dynamic attributes */}
          {p.attributes && p.attributes.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {p.attributes.map((attr) => (
                  <div key={attr.id} className="contents">
                    <dt className="text-gray-500 dark:text-gray-400">{attr.label}</dt>
                    <dd className="text-gray-900 dark:text-white font-medium text-right">
                      {formatAttrValue(attr.value, attr.key)}
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
                Vendeur
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600 font-display">
                    {p.seller_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{p.seller_name}</div>
                  <Link
                    to={`/shop/${p.seller_name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1"
                  >
                    Voir la boutique <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 text-center">
            Publié le {new Date(p.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatAttrValue(value: unknown, key: string): string {
  if (value === true) return 'Oui'
  if (value === false) return 'Non'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
