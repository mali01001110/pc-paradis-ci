import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { productService, categoryService } from '@/services/productService'
import ProductCard from '@/components/ProductCard'
import { ProductRow, ProductRowSlide } from '@/components/ProductRow'
import { ProductGrid, ProductCardSkeleton } from '@/components/ProductGrid'
import { CategoryShowcase, flattenCategories } from '@/components/CategoryShowcase'
import { useProductRow } from '@/hooks/useProductRow'
import type { Product } from '@/types/product'
import heroImage from '@/assets/hero.png'
import { MOCK_CATEGORY_TREE, MOCK_PRODUCTS } from '@/data/mockData'

const TOP_CATEGORY_SECTIONS = [
  { title: 'Composants internes', slug: 'composants-internes' },
  { title: 'Composants externes', slug: 'composants-externes' },
  { title: 'Accessoires', slug: 'accessoires' },
]

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

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const catParam = searchParams.get('cat') ?? ''
  const queryParam = searchParams.get('q') ?? ''
  const isFiltered = Boolean(catParam || queryParam)

  const { data: filtered } = useQuery({
    queryKey: ['products', catParam, queryParam],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (catParam) params['category'] = catParam
      if (queryParam) params['q'] = queryParam
      params['ordering'] = '-created_at'
      return (await productService.listProducts(params)).data
    },
  })

  const { data: categoryTree, isLoading: treeLoading } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
  })

  const recents = useProductRow({ ordering: '-created_at' })
  const populars = useProductRow({ ordering: '-views_count' })
  const gpuRow = useProductRow({ category: 'gpu' })
  const cpuRow = useProductRow({ category: 'cpu' })
  const ramRow = useProductRow({ category: 'ram' })
  const stockageRow = useProductRow({ category: 'stockage' })
  const ecransRow = useProductRow({ category: 'ecrans' })

  const mockCategories = !categoryTree || categoryTree.length === 0 ? MOCK_CATEGORY_TREE : categoryTree
  const flatCats = flattenCategories(mockCategories)

  const getProducts = <T extends { results?: Product[] }>(query: { data?: T; isLoading: boolean; isError: boolean }, fallback: Product[]) =>
    !query.isLoading && !query.isError && (query.data?.results?.length ?? 0) > 0 ? query.data!.results! : fallback

  const recentProducts: Product[] = getProducts(recents, [...(MOCK_PRODUCTS.gpu ?? []), ...(MOCK_PRODUCTS.cpu ?? []), ...(MOCK_PRODUCTS.ram ?? [])])
  const popularProducts: Product[] = getProducts(populars, recentProducts)
  const gpuProducts = getProducts(gpuRow, MOCK_PRODUCTS.gpu ?? [])
  const cpuProducts = getProducts(cpuRow, MOCK_PRODUCTS.cpu ?? [])
  const ramProducts = getProducts(ramRow, MOCK_PRODUCTS.ram ?? [])
  const stockageProducts = getProducts(stockageRow, MOCK_PRODUCTS.stockage ?? [])
  const ecransProducts = getProducts(ecransRow, MOCK_PRODUCTS.ecrans ?? [])

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
          src={heroImage}
          alt=""
          aria-hidden="true"
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
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-sm text-gray-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {filtered?.count ? filtered.count.toLocaleString('fr-FR') : '150+'}
              </div>
              <div>Annonces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {categoryTree ? categoryTree.length : mockCategories.length}
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
               flatCats.find((c) => c.slug === catParam)?.name ?? 'Produits'}
              {filtered?.count != null && (
                <span className="text-gray-400 text-base ml-2">({filtered.count})</span>
              )}
            </h2>
          </div>

          <ProductGrid products={filtered?.results ?? []} loading={!filtered} />

          {filtered && filtered.results.length === 0 && (
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
          )}
        </section>
      ) : (
        <>
          {/* 3. Catégories */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Catégories</h2>
              <Link to="/" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1">
                Voir tout
              </Link>
            </div>
            <CategoryShowcase categories={flatCats.slice(0, 12)} loading={treeLoading} activeSlug={catParam} />
          </section>

          {/* 4-6. Familles de produits */}
          {TOP_CATEGORY_SECTIONS.map((sec) => {
            const mock = sec.slug === 'composants-internes'
              ? [...(MOCK_PRODUCTS.gpu ?? []), ...(MOCK_PRODUCTS.cpu ?? []), ...(MOCK_PRODUCTS.ram ?? []), ...(MOCK_PRODUCTS.stockage ?? [])]
              : sec.slug === 'composants-externes'
              ? [...(MOCK_PRODUCTS.ecrans ?? [])]
              : []
            return <CategoryRow key={sec.slug} title={sec.title} slug={sec.slug} mockProducts={mock} />
          })}

          {/* 7. Produits récents */}
          <CarouselSection
            title="Produits récents"
            products={recentProducts}
            loading={recents.isLoading}
          />

          {/* 8. Produits populaires */}
          <CarouselSection
            title="Produits populaires"
            products={popularProducts}
            loading={populars.isLoading}
          />

          {/* 9-13. Sélections par catégorie */}
          <CarouselSection title="Cartes graphiques" viewAllTo="/products?cat=gpu" products={gpuProducts} loading={gpuRow.isLoading} />
          <CarouselSection title="Processeurs" viewAllTo="/products?cat=cpu" products={cpuProducts} loading={cpuRow.isLoading} />
          <CarouselSection title="Mémoire RAM" viewAllTo="/products?cat=ram" products={ramProducts} loading={ramRow.isLoading} />
          <CarouselSection title="Stockage" viewAllTo="/products?cat=stockage" products={stockageProducts} loading={stockageRow.isLoading} />
          <CarouselSection title="Écrans" viewAllTo="/products?cat=ecrans" products={ecransProducts} loading={ecransRow.isLoading} />
        </>
      )}

      {/* 13. CTA vendeur */}
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
      {/* 14. Footer — géré par MainLayout */}
    </div>
  )
}

function CategoryRow({ title, slug, mockProducts }: { title: string; slug: string; mockProducts?: Product[] }) {
  const { data, isLoading, isError } = useProductRow({ category: slug })
  const displayProducts = (!isLoading && !isError && (data?.results?.length ?? 0) > 0) ? data!.results! : (mockProducts ?? [])
  return (
    <CarouselSection title={title} viewAllTo={`/products?cat=${slug}`} products={displayProducts} loading={isLoading} />
  )
}
