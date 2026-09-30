import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import SellersPage from './SellersPage'
import { I18nProvider } from '@/i18n'
import { CurrencyProvider } from '@/hooks/useCurrency'

vi.mock('@/services/shopService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/shopService')>()
  return {
    ...actual,
    shopService: {
      ...actual.shopService,
      getPublicSellers: vi.fn(),
    },
  }
})

import { shopService } from '@/services/shopService'

const MOCK_LIST = vi.mocked(shopService.getPublicSellers)

function listResponse(results: unknown[], count = results.length) {
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
              <Route path="/sellers" element={<SellersPage />} />
            </Routes>
          </CurrencyProvider>
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SellersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a list of public sellers', async () => {
    MOCK_LIST.mockResolvedValue(
      listResponse([
        {
          id: 's1',
          business_name: 'TechStore Abidjan',
          first_name: 'Jean',
          last_name: 'Kouassi',
          city: 'Abidjan',
          commune: 'Cocody',
          shop_name: 'TechStore Abidjan',
          shop_slug: 'techstore-abidjan',
          product_count: 12,
          created_at: new Date().toISOString(),
        },
      ])
    )
    render(renderAt('/sellers'))
    expect((await screen.findAllByText('TechStore Abidjan')).length).toBeGreaterThan(0)
    expect(await screen.findByText('12 produits')).toBeInTheDocument()
    expect(await screen.findByText('Abidjan, Cocody')).toBeInTheDocument()
  })

  it('shows the empty state when no sellers', async () => {
    MOCK_LIST.mockResolvedValue(listResponse([]))
    render(renderAt('/sellers'))
    expect(await screen.findByText('Aucun vendeur pour le moment.')).toBeInTheDocument()
  })
})