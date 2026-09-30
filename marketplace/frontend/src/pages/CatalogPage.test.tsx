import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import CatalogPage from './CatalogPage'
import type { Product } from '@/types/product'
import { I18nProvider } from '@/i18n'
import { CurrencyProvider } from '@/hooks/useCurrency'

vi.mock('@/services/productService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/productService')>()
  return {
    ...actual,
    productService: {
      ...actual.productService,
      listProducts: vi.fn(),
    },
    categoryService: {
      ...actual.categoryService,
      getFilterOptions: vi.fn().mockResolvedValue({
        data: {
          category: 'gpu',
          filters: [
            {
              key: 'vram',
              label: 'VRAM',
              value_type: 'number',
              unit: 'GB',
              options: [],
              values: [8, 12],
            },
          ],
        },
      }),
    },
  }
})

import { productService } from '@/services/productService'

const MOCKED_LIST = vi.mocked(productService.listProducts)

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'rtx-4070',
    title: 'RTX 4070 Super',
    model: '4070 Super',
    description: 'Carte graphique',
    price: 450000,
    currency: 'FCFA',
    condition: 'OCCASION',
    condition_display: 'Occasion',
    status: 'AVAILABLE',
    status_display: 'Disponible',
    city: 'Abidjan',
    commune: 'Cocody',
    phone: '+2250708091011',
    whatsapp: '+2250708091011',
    views_count: 3,
    images: [],
    attributes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Product
}

function listResponse(results: Product[], count = results.length) {
  return {
    data: { count, next: null, previous: null, results },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }
}

function renderAt(path: string): ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/products" element={<CatalogPage />} />
            </Routes>
          </CurrencyProvider>
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MOCKED_LIST.mockResolvedValue(listResponse([makeProduct()], 1))
  })

  it('renders the catalog title and product grid', async () => {
    render(renderAt('/products'))
    expect(await screen.findByTestId('catalog-grid')).toBeInTheDocument()
    expect(await screen.findByText('RTX 4070 Super')).toBeInTheDocument()
    expect(screen.getByText('1 produits')).toBeInTheDocument()
  })

  it('sends category param from URL to listProducts', async () => {
    render(renderAt('/products?cat=gpu'))
    await screen.findByTestId('catalog-grid')
    await waitFor(() => {
      expect(MOCKED_LIST).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'gpu' })
      )
    })
  })

  it('converts attr_* URL params into listProducts params', async () => {
    render(renderAt('/products?cat=gpu&attr_vram=8,12'))
    await screen.findByTestId('catalog-grid')
    await waitFor(() => {
      expect(MOCKED_LIST).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'gpu',
          attr_vram: '8,12',
        })
      )
    })
  })

  it('shows the empty state when no results', async () => {
    MOCKED_LIST.mockResolvedValue(listResponse([]))
    render(renderAt('/products'))
    expect(await screen.findByTestId('catalog-empty')).toBeInTheDocument()
  })

  it('fetches filter options for the active category', async () => {
    render(renderAt('/products?cat=gpu'))
    await screen.findByTestId('catalog-grid')
    await waitFor(() => {
      expect(screen.getByText('VRAM')).toBeInTheDocument()
    })
  })
})
