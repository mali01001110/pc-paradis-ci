import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import HomePage from './HomePage'

vi.mock('@/services/productService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/productService')>()
  return {
    ...actual,
    productService: {
      ...actual.productService,
      listProducts: vi.fn().mockResolvedValue({
        data: { count: 0, next: null, previous: null, results: [] },
      }),
    },
    categoryService: {
      ...actual.categoryService,
      getTree: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Composants',
            slug: 'composants',
            parent: null,
            description: '',
            icon: '',
            sort_order: 0,
            children: [
              { id: '2', name: 'Processeurs', slug: 'processeurs', parent: '1', description: '', icon: '', sort_order: 0 },
              { id: '3', name: 'Cartes graphiques', slug: 'cartes-graphiques', parent: '1', description: '', icon: '', sort_order: 1 },
            ],
          },
        ],
      }),
    },
  }
})

function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HomePage', () => {
  it('renders the hero headline', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText('LE HARDWARE PC & GAMING')).toBeInTheDocument()
  })

  it('renders the seller CTA link', () => {
    renderWithProviders(<HomePage />)
    const link = screen.getByText('Vendre gratuitement')
    expect(link).toBeInTheDocument()
  })

  it('renders category cards from the catalogue', async () => {
    renderWithProviders(<HomePage />)
    await screen.findByText('Processeurs')
    expect(screen.getByText('Cartes graphiques')).toBeInTheDocument()
  })
})
