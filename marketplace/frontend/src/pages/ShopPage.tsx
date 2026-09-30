import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopService } from '@/services/shopService'
import { productService } from '@/services/productService'
import { Phone, MessageCircle, MapPin, Package } from 'lucide-react'
import { getErrorMessage } from '@/services/api'
import { normalizePhone } from '@/lib/phone'
import ProductCard from '@/components/ProductCard'

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: shop, isLoading, error } = useQuery({
    queryKey: ['shop', slug],
    queryFn: () => shopService.getPublicShop(slug!).then((r) => r.data),
    enabled: !!slug,
    retry: false,
  })

  const { data: products } = useQuery({
    queryKey: ['shop-products', slug],
    queryFn: () =>
      productService
        .listProducts({ shop: slug!, ordering: '-created_at' })
        .then((r) => r.data),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement de la boutique…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package size={56} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Boutique introuvable</h1>
        <p className="text-gray-500 text-sm mb-6">{getErrorMessage(error)}</p>
        <Link to="/" className="btn-primary px-6">Retour à l'accueil</Link>
      </div>
    )
  }

  if (!shop) return null
  const tel = normalizePhone(shop.phone)
  const wa = normalizePhone(shop.whatsapp || shop.phone)
  const shopProducts = products?.results ?? []
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Shop header */}
      <div className="card p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-600 font-display">
                {shop.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">
              {shop.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              {shop.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {shop.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Package size={14} /> {shop.product_count} produits
              </span>
            </div>
            {shop.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm leading-relaxed">
                {shop.description}
              </p>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 mt-6">
          {shop.phone && (
            <a href={`tel:${tel}`} className="btn-primary flex-1 min-w-40">
              <Phone size={16} />
              Appeler
            </a>
          )}
          {(shop.whatsapp || shop.phone) && (
            <a
              href={`https://wa.me/${wa.replace('+', '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par les produits de ${shop.name} sur PC Paradis CI.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-1"
              style={{ borderColor: '#25D366', color: '#128C7E' }}
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Products */}
      <section>
        <h2 className="section-title mb-4">
          Produits <span className="text-gray-400 text-base">({products?.count ?? shop.product_count})</span>
        </h2>
        {!products ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : shopProducts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            {"Cette boutique n'a pas encore de produits publiés."}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shopProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}