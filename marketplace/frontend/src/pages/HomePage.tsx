import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { categoryService, productService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import {
  CategoryShowcase,
  CategoryShowcaseSkeleton,
  flattenCategories,
} from '@/components/CategoryShowcase'

// Homepage product/category queries stay fresh longer (10 min) to avoid
// refetches on window focus and across the shared section/carousel queries.
const HOME_STALE_TIME = 1000 * 60 * 10

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const catParam = searchParams.get('cat') ?? ''
  const queryParam = searchParams.get('q') ?? ''

  const {
    data: categoryTree,
    isLoading: treeLoading,
    isError: categoryTreeError,
    error: categoryTreeFetchError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
    staleTime: HOME_STALE_TIME,
  })

  const { data: productCountData, isLoading: productCountLoading } = useQuery({
    queryKey: ['product-count'],
    queryFn: () => productService.listProducts({ page_size: '1' }),
    staleTime: HOME_STALE_TIME,
  })

  const flatCats = useMemo(() => flattenCategories(categoryTree ?? []), [categoryTree])
  const productSubcategoryCount = useMemo(
    () =>
      (categoryTree ?? []).reduce(
        (count, parent) => count + (parent.children?.length ?? 0),
        0
      ),
    [categoryTree]
  )

  const internalCats = useMemo(
    (): { id: string; name: string; slug: string; parentName: string }[] => {
      const node =
        (categoryTree ?? []).find((c) => c.slug === 'composants-internes') ??
        (categoryTree ?? []).find((c) => c.name.toLowerCase().includes('composants internes'))
      if (!node?.children?.length) return []
      return node.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        parentName: node.name,
      }))
    },
    [categoryTree]
  )

  const categoryName = (slug: string) => {
    const found = flatCats.find((c) => c.slug === slug)
    if (found) return found.name
    const topLevel = categoryTree?.find((c) => c.slug === slug)
    return topLevel?.name ?? slug
  }

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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white border border-primary-600 hover:bg-primary-700 transition-colors dark:bg-primary-600 dark:text-white dark:border-primary-600 dark:hover:bg-primary-700 px-8 py-3.5 text-base font-semibold"
            >
              Vendre gratuitement
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 text-sm text-gray-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {productCountLoading
                  ? '…'
                  : productCountData?.data.count.toLocaleString('fr-FR') ?? '0'}
              </div>
              <div>Annonces</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">
                {treeLoading
                  ? '…'
                  : categoryTreeError
                    ? 'Indisponible'
                    : productSubcategoryCount.toLocaleString('fr-FR')}
              </div>
              <div>Sous-catégories de produits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-display">100%</div>
              <div>Gratuit</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Catégories</h2>
          <Link to="/categories" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1">
            Voir tout
          </Link>
        </div>
        {categoryTreeError ? (
          <div className="card p-8 text-center">
            <p className="text-red-500 mb-4">{getErrorMessage(categoryTreeFetchError)}</p>
            <button onClick={() => void refetchCategories()} className="btn-secondary text-sm">
              Réessayer
            </button>
          </div>
        ) : treeLoading ? (
          <CategoryShowcaseSkeleton count={10} variant="icon" />
        ) : internalCats.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Aucune sous-catégorie de composants internes disponible.
            </p>
            <button onClick={() => void refetchCategories()} className="btn-secondary text-sm">
              Actualiser
            </button>
          </div>
        ) : (
          <CategoryShowcase categories={internalCats} activeSlug={catParam} variant="icon" />
        )}
      </section>
      {/* 14. Footer — géré par MainLayout */}
    </div>
  )
}
