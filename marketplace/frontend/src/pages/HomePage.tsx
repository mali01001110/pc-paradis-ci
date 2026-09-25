import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { productService, categoryService } from '@/services/productService'
import ProductCard from '@/components/ProductCard'
import type { Category } from '@/types/product'

const ICON_MAP: Record<string, string> = {
  cpu: '🖥️', gpu: '🎮', ram: '⚡', storage: '💾',
  monitor: '🖥️', peripherals: '⌨️', case: '📦', psu: '🔌',
  cooling: '❄️', networking: '🌐', audio: '🔊', webcam: '📷',
  default: '📦',
}

function catIcon(slug: string): string {
  return ICON_MAP[slug] ?? ICON_MAP.default
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const catParam = searchParams.get('cat') ?? ''
  const queryParam = searchParams.get('q') ?? ''

  const { data: products } = useQuery({
    queryKey: ['products', catParam, queryParam],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (catParam) params['category'] = catParam
      if (queryParam) params['q'] = queryParam
      params['ordering'] = '-created_at'
      return (await productService.listProducts(params)).data
    },
  })

  const { data: categoryTree } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      next.set('q', searchInput.trim())
    } else {
      next.delete('q')
    }
    setSearchParams(next, { replace: true })
  }

  const handleCatSelect = (slug: string) => {
    const next = new URLSearchParams(searchParams)
    if (slug === catParam) {
      next.delete('cat')
    } else {
      next.set('cat', slug)
    }
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const flatCats = (categoryTree ?? []).flatMap((c: Category) =>
    (c.children ?? []).length > 0
      ? c.children!.map((child) => ({ ...child, parent: c.name }))
      : [c]
  )

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white dark:from-[#1a0f3c] dark:via-[#0f0a1e] dark:to-[#0f0a1e]">
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            Marché du hardware PC en Côte d&apos;Ivoire
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white font-display tracking-tight leading-tight mb-6">
            LE HARDWARE PC &amp; GAMING
            <br />
            <span className="text-primary-600">EN UN SEUL ENDROIT</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Achetez et vendez du matériel PC, gaming et informatique en Côte d&apos;Ivoire.
            Gratuit pour les vendeurs. Sans commission.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={"RTX 4070, Ryzen 7800X3D, DDR5 32GB, SSD 2TB…"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pl-12 pr-32 py-4 text-base shadow-lg border-gray-200 dark:border-gray-700 w-full"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-5">
                Rechercher
              </button>
            </form>
          </div>

          {/* Active filters */}
          {(catParam || queryParam) && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {queryParam && (
                <span className="text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                  Recherche: &quot;{queryParam}&quot;
                  <button onClick={() => { const n = new URLSearchParams(searchParams); n.delete('q'); setSearchParams(n); }} className="ml-2 font-bold">{"×"}</button>
                </span>
              )}
              {catParam && (
                <span className="text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
                  {"Catégorie"}: {flatCats.find((c) => c.slug === catParam)?.name ?? catParam}
                  <button onClick={() => { const n = new URLSearchParams(searchParams); n.delete('cat'); setSearchParams(n); }} className="ml-2 font-bold">{"×"}</button>
                </span>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="btn-primary px-8 py-3.5 text-base">
              Explorer les annonces
            </Link>
            <Link to="/auth/register" className="btn-secondary px-8 py-3.5 text-base">
              Vendre gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-sm text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                {products?.count?.toLocaleString('fr-FR') ?? '—'}
              </div>
              <div>Annonces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                {categoryTree ? categoryTree.length : '—'}
              </div>
              <div>Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">100%</div>
              <div>Gratuit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Catégories</h2>
          <Link to="/" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1">
            Voir tout
          </Link>
        </div>
        {flatCats.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {flatCats.slice(0, 12).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCatSelect(cat.slug)}
                className={`card p-4 flex flex-col items-center text-center hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow transition-all duration-200 ${
                  catParam === cat.slug ? 'border-primary-500 dark:border-primary-500' : ''
                }`}
              >
                <div className="text-2xl mb-2">{catIcon(cat.slug)}</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{cat.name}</div>
                <div className="text-xs text-gray-400">{cat.parent ?? ''}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {['CPU', 'GPU', 'RAM', 'Storage', 'Monitors', 'Peripherals'].map((c, i) => (
              <div key={c} className="card p-4 flex flex-col items-center text-center">
                <div className="text-2xl mb-2">{['🖥️', '🎮', '⚡', '💾', '🖥️', '⌨️'][i]}</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{c}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">
            {queryParam ? `Résultats pour "${queryParam}"` :
             catParam ? flatCats.find((c) => c.slug === catParam)?.name ?? 'Produits' :
             'Produits récents'}
            {products?.count != null && (
              <span className="text-gray-400 text-base ml-2">({products.count})</span>
            )}
          </h2>
        </div>

        {!products ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.results.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 mb-4">
              {queryParam
                ? `Aucun résultat pour "${queryParam}".`
                : 'Aucun produit dans cette catégorie.'}
            </p>
            <Link to="/" className="btn-secondary text-sm inline-flex items-center gap-2">
              Voir tous les produits <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {products.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {products && products.next && (
          <div className="mt-8 text-center">
            <Link
              to={`/?${searchParams.toString()}`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              Voir plus <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* CTA seller section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-4">
            Devenez vendeur sur PC Paradis CI
          </h2>
          <p className="text-primary-100 max-w-xl mx-auto mb-8">
            Créez gratuitement votre espace, publiez vos annonces sans frais. Sans commission, sans abonnement. Contactez directement vos acheteurs par téléphone ou WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Créer mon espace gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
