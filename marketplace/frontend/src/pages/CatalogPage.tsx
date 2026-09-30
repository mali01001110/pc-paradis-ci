import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Package, SlidersHorizontal } from 'lucide-react'
import { productService, categoryService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import ProductCard from '@/components/ProductCard'
import { Pagination } from '@/components/ui/Pagination'
import { FilterPanel, type FilterValues } from '@/components/ui/FilterPanel'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog'
import { useSEO } from '@/hooks/useSEO'
import { useT } from '@/i18n'

const PAGE_SIZE = 24

const ORDERING_OPTIONS = [
  { value: '-created_at', labelKey: 'catalog.orderRecent' },
  { value: 'price', labelKey: 'catalog.orderPriceAsc' },
  { value: '-price', labelKey: 'catalog.orderPriceDesc' },
  { value: '-views_count', labelKey: 'catalog.orderPopular' },
] as const

function parseValues(searchParams: URLSearchParams): FilterValues {
  const attrs: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('attr_')) attrs[key.slice(5)] = value
  })
  return {
    attrs,
    minPrice: searchParams.get('min_price') ?? undefined,
    maxPrice: searchParams.get('max_price') ?? undefined,
    condition: searchParams.get('condition') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    commune: searchParams.get('commune') ?? undefined,
  }
}

/**
 * Full catalog with faceted filters (spec §34). Filters live in the URL so
 * results are shareable and back/forward works. Dynamic facets come from the
 * category's filter-options endpoint.
 */
export default function CatalogPage() {
  const { t } = useT()
  const [searchParams, setSearchParams] = useSearchParams()

  const cat = searchParams.get('cat') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const shop = searchParams.get('shop') ?? undefined
  const ordering = searchParams.get('ordering') ?? '-created_at'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const values = useMemo(() => parseValues(searchParams), [searchParams])

  useSEO({ title: cat ? `${cat} — PC Paradis CI` : 'Catalogue — PC Paradis CI' })

  const { data: optionsData } = useQuery({
    queryKey: ['filter-options', cat],
    queryFn: () => categoryService.getFilterOptions(cat!).then((r) => r.data),
    enabled: !!cat,
  })

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), ordering }
    if (cat) p.category = cat
    if (q) p.q = q
    if (shop) p.shop = shop
    if (values.minPrice) p.min_price = values.minPrice
    if (values.maxPrice) p.max_price = values.maxPrice
    if (values.condition) p.condition = values.condition
    if (values.brand) p.brand = values.brand
    if (values.city) p.city = values.city
    if (values.commune) p.commune = values.commune
    for (const [key, value] of Object.entries(values.attrs)) p[`attr_${key}`] = value
    return p
  }, [cat, q, shop, ordering, page, values])

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['catalog', params],
    queryFn: () => productService.listProducts(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  /** Merge a filter change into the URL, resetting the page. */
  const updateParams = (patch: Record<string, string | null | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (resetPage) next.delete('page')
    setSearchParams(next, { replace: false })
  }

  const totalPages = products ? Math.ceil(products.count / PAGE_SIZE) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-display">
            {t('catalog.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {products ? `${products.count} ${t('catalog.results')}` : t('common.loading')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: filter drawer */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="lg:hidden btn-secondary px-4 py-2 text-sm"
                aria-label={t('catalog.filters')}
              >
                <SlidersHorizontal size={16} />
                {t('catalog.filters')}
              </button>
            </DialogTrigger>
            <DialogContent title={t('catalog.filters')}>
              <FilterPanel
                options={optionsData?.filters ?? []}
                values={values}
                onChange={(v) =>
                  updateParams({
                    ...Object.fromEntries(
                      Object.keys(values.attrs).map((k) => [`attr_${k}`, null])
                    ),
                    ...Object.fromEntries(Object.entries(v.attrs).map(([k, val]) => [`attr_${k}`, val])),
                    min_price: v.minPrice ?? null,
                    max_price: v.maxPrice ?? null,
                    condition: v.condition ?? null,
                    city: v.city ?? null,
                    commune: v.commune ?? null,
                  })
                }
              />
            </DialogContent>
          </Dialog>

          <label htmlFor="catalog-ordering" className="sr-only">{t('catalog.orderBy')}</label>
          <select
            id="catalog-ordering"
            value={ordering}
            onChange={(e) => updateParams({ ordering: e.target.value })}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            {ORDERING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex gap-6">
        {/* Desktop: sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-4 sticky top-24">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              {t('catalog.filters')}
            </h2>
            <FilterPanel
              options={optionsData?.filters ?? []}
              values={values}
              onChange={(v) =>
                updateParams({
                  ...Object.fromEntries(
                    Object.keys(values.attrs).map((k) => [`attr_${k}`, null])
                  ),
                  ...Object.fromEntries(Object.entries(v.attrs).map(([k, val]) => [`attr_${k}`, val])),
                  min_price: v.minPrice ?? null,
                  max_price: v.maxPrice ?? null,
                  condition: v.condition ?? null,
                })
              }
            />
          </div>
        </aside>

        {/* Results */}
        <section className="flex-1 min-w-0">
          {error ? (
            <div className="card p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {getErrorMessage(error)}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !products || products.results.length === 0 ? (
            <div className="card p-10 text-center" data-testid="catalog-empty">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('catalog.empty')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="catalog-grid">
                {products.results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => updateParams({ page: p === 1 ? null : String(p) }, false)}
                className="mt-8"
              />
            </>
          )}

          {cat && (
            <p className="mt-6 text-xs text-gray-400 text-center">
              {t('catalog.filteredBy')}{' '}
              <Link to="/products" className="text-primary-600 dark:text-primary-400 underline">
                {t('catalog.clearCategory')}
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
