import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { productService, categoryService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import { ProductRow, ProductRowSlide } from '@/components/ProductRow'
import { ProductGrid, ProductCardSkeleton } from '@/components/ProductGrid'
import { CategoryShowcase, flattenCategories } from '@/components/CategoryShowcase'
import { useProductRow } from '@/hooks/useProductRow'
import type { ProductRowParams } from '@/hooks/useProductRow'
import type { Product } from '@/types/product'

const TOP_CATEGORY_SECTIONS = [
  { title: 'Composants internes', slug: 'composants-internes' },
  { title: 'Composants externes', slug: 'composants-externes' },
  { title: 'Accessoires', slug: 'accessoires' },
]

// Homepage product/category queries stay fresh longer (10 min) to avoid
// refetches on window focus and across the shared section/carousel queries.
const HOME_STALE_TIME = 1000 * 60 * 10
const SECTION_ROOT_MARGIN = '500px 0px'

function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setIsNearViewport(true)
        observer.disconnect()
      }
    }, { rootMargin: SECTION_ROOT_MARGIN })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isNearViewport }
}

function CarouselSection({
  title,
  viewAllTo,
  products,
  loading,
}: {
  title: string
  viewAllTo?: string
  products?: Product[]
  loading: boolean
}) {
  if (!loading && (!products || products.length === 0)) return null

  return (
    <ProductRow title={title} viewAllTo={viewAllTo} className="max-w-7xl mx-auto px-4 sm:px-6">
      {loading || !products
        ? Array.from({ length: 4 }).map((_, i) => (
            <ProductRowSlide key={i}>
              <ProductCardSkeleton />
            </ProductRowSlide>
          ))
        : products.map((product) => (
            <ProductRowSlide key={product.id}>
              <ProductCard product={product} />
            </ProductRowSlide>
          ))}
    </ProductRow>
  )
}

function HomeProductRow({
  title,
  viewAllTo,
  params,
}: {
  title: string
  viewAllTo?: string
  params: ProductRowParams
}) {
  const { ref, isNearViewport } = useNearViewport()
  const query = useProductRow(params, {
    staleTime: HOME_STALE_TIME,
    enabled: isNearViewport,
  })
  const products = query.data?.results ?? []

  if (isNearViewport && !query.isLoading && (query.isError || products.length === 0)) {
    return null
  }

  return (
    <div ref={ref} className={!isNearViewport ? 'min-h-[400px]' : undefined}>
      {isNearViewport && (
        <CarouselSection
          title={title}
          viewAllTo={viewAllTo}
          products={products}
          loading={query.isLoading}
        />
      )}
    </div>
  )
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const catParam = searchParams.get('cat') ?? ''
  const queryParam = searchParams.get('q') ?? ''
  const isFiltered = Boolean(catParam || queryParam)

  const { data: filtered, isError, isLoading: filteredIsLoading } = useQuery({
    queryKey: ['products', catParam, queryParam],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (catParam) params['category'] = catParam
      if (queryParam) params['q'] = queryParam
      params['ordering'] = '-created_at'
      return (await productService.listProducts(params)).data
    },
    staleTime: HOME_STALE_TIME,
    enabled: isFiltered,
  })

  const { data: categoryTree, isLoading: treeLoading } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
    staleTime: HOME_STALE_TIME,
  })

  const recents = useProductRow({ ordering: '-created_at' }, { staleTime: HOME_STALE_TIME })
  const flatCats = flattenCategories(categoryTree ?? [])
  const childCategoryCount = (categoryTree ?? []).reduce(
    (count, parent) => count + (parent.children?.length ?? 0),
    0
  )

  const internalCats: { id: string; name: string; slug: string; parentName: string }[] = (() => {
    const node = (categoryTree ?? []).find((c) => c.slug === 'composants-internes')
    if (!node?.children?.length) return []
    return node.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      parentName: node.name,
    }))
  })()

  const getProducts = <T extends { results?: Product[] }>(query: { data?: T; isLoading: boolean; isError: boolean }, fallback: Product[]) =>
    !query.isLoading && !query.isError && (query.data?.results?.length ?? 0) > 0 ? query.data!.results! : fallback

  const recentProducts: Product[] = getProducts(recents, [])
  const showProductRows = recents.isError || (recents.data?.count ?? 0) > 0
  const categoryName = (slug: string) => {
    const found = flatCats.find((c) => c.slug === slug)
    if (found) return found.name
    const topLevel = categoryTree?.find((c) => c.slug === slug)
    return topLevel?.name ?? slug
  }

  const filteredResults: Product[] = filtered?.results ?? []

  const gridLoading = filteredIsLoading || (filtered == null && !isError)

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

  return (
    <div>
      {/* 1-2. Hero + Recherche */}
      <section className="relative overflow-hidden">
        <img
          src="/hero-3c25cae9ba1e.webp"
          alt=""
          aria-hidden="true"
          width={1983}
          height={793}
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0f0a1e]/40 via-[#0f0a1e]/30 to-[#0f0a1e]/55" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-primary-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            Marché du hardware PC en Côte d&apos;Ivoire
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white font-display tracking-tight leading-tight mb-6">
            LE HARDWARE PC &amp; GAMING
            <br />
            <span className="text-purple-600">EN UN SEUL ENDROIT</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-gray-100 max-w-2xl mx-auto mb-10">
            Achetez et vendez du matériel PC, gaming et informatique en Côte d&apos;Ivoire.
            Gratuit pour les vendeurs. Sans commission.
          </p>

          {/* 2. Recherche */}
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
                  {"Catégorie"}: {categoryName(catParam)}
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
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-primary-600 border border-primary-200 hover:bg-gray-100 transition-colors dark:bg-white dark:text-primary-600 dark:border-primary-200 dark:hover:bg-primary-50 px-8 py-3.5 text-base font-semibold"
            >
              Vendre gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-sm text-gray-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {recents.data?.count.toLocaleString('fr-FR') ?? (recents.isError ? 'Indisponible' : '…')}
              </div>
              <div>Annonces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {childCategoryCount.toLocaleString('fr-FR')}
              </div>
              <div>Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">100%</div>
              <div>Gratuit</div>
            </div>
          </div>
        </div>
      </section>

      {isFiltered ? (
        /* Filtered results view */
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">
              {queryParam ? `Résultats pour "${queryParam}"` :
               categoryName(catParam)}
              <span className="text-gray-400 text-base ml-2">({filtered?.count ?? filteredResults.length})</span>
            </h2>
          </div>

          <ProductGrid products={filteredResults} loading={gridLoading} />

          {isError && (
            <div className="card p-12 text-center">
              <p className="text-red-500 mb-4">
                {getErrorMessage(filtered) || "Une erreur est survenue lors de la recherche."}
              </p>
              <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
                Réessayer
              </button>
            </div>
          )}

          {!isError && filteredResults.length === 0 && !gridLoading && (
            <div className="card p-12 text-center">
              <p className="text-gray-500 mb-4">
                {queryParam
                  ? `Aucun résultat pour "${queryParam}".`
                  : 'Aucun produit dans cette catégorie.'}
              </p>
              {queryParam && (
                <p className="text-sm text-gray-400 mb-4">
                  Essayez des termes plus courts ou plus généraux.
                </p>
              )}
              <Link to="/" className="btn-secondary text-sm inline-flex items-center gap-2">
                Voir tous les produits <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* 3. Catégories */}
          {treeLoading || internalCats.length > 0 ? (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="section-title">Catégories</h2>
                <Link to="/categories" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1">
                  Voir tout
                </Link>
              </div>
              <CategoryShowcase categories={internalCats} loading={treeLoading} activeSlug={catParam} />
            </section>
          ) : null}

          {showProductRows && (
            <>
              {/* 4-6. Familles de produits */}
              {TOP_CATEGORY_SECTIONS.map((sec) => (
                <HomeProductRow
                  key={sec.slug}
                  title={sec.title}
                  viewAllTo={`/products?cat=${sec.slug}`}
                  params={{ category: sec.slug }}
                />
              ))}

              {/* 7. Produits récents */}
              <CarouselSection
                title="Produits récents"
                products={recentProducts}
                loading={recents.isLoading}
              />

              {/* 8. Produits populaires */}
              <HomeProductRow
                title="Produits populaires"
                params={{ ordering: '-views_count' }}
              />

              {/* 9-13. Sélections par catégorie */}
              <HomeProductRow title="Cartes graphiques" viewAllTo="/products?cat=gpu" params={{ category: 'gpu' }} />
              <HomeProductRow title="Processeurs" viewAllTo="/products?cat=cpu" params={{ category: 'cpu' }} />
              <HomeProductRow title="Mémoire RAM" viewAllTo="/products?cat=ram" params={{ category: 'ram' }} />
              <HomeProductRow title="Stockage" viewAllTo="/products?cat=stockage" params={{ category: 'stockage' }} />
              <HomeProductRow title="Écrans" viewAllTo="/products?cat=ecrans" params={{ category: 'ecrans' }} />
            </>
          )}
        </>
      )}

      {/* 13. CTA vendeur */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-4">
            Devenez vendeur sur PC Paradis
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
      {/* 14. Footer — géré par MainLayout */}
    </div>
  )
}
