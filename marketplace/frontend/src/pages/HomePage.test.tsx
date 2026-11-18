import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { productService } from '@/services/productService'
import HomePage from './HomePage'

vi.mock('@/services/productService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/productService')>()
  return {
    ...actual,
    productService: {
      ...actual.productService,
      listProducts: vi.fn().mockImplementation((params?: Record<string, string>) =>
        Promise.resolve({
          data: { count: params?.page_size ? 42 : 3, next: null, previous: null, results: [] },
        })
      ),
    },
    categoryService: {
      ...actual.categoryService,
      getTree: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Composants Internes',
            slug: 'composants-internes',
            parent: null,
            description: '',
            icon: '',
            sort_order: 0,
            children: [
              { id: '2', name: 'Processeurs', slug: 'processeurs', parent: '1', description: '', icon: '', sort_order: 0 },
              { id: '3', name: 'Cartes graphiques', slug: 'cartes-graphiques', parent: '1', description: '', icon: '', sort_order: 1 },
            ],
          },
          {
            id: '4',
            name: 'Composants Externes',
            slug: 'composants-externes',
            parent: null,
            description: '',
            icon: '',
            sort_order: 1,
            children: [
              { id: '5', name: 'Écrans', slug: 'ecrans', parent: '4', description: '', icon: '', sort_order: 0 },
            ],
          },
          {
            id: '6',
            name: 'Accessoires',
            slug: 'accessoires',
            parent: null,
            description: '',
            icon: '',
            sort_order: 2,
            children: [
              { id: '7', name: 'Claviers', slug: 'claviers', parent: '6', description: '', icon: '', sort_order: 0 },
            ],
          },
        ],
      }),
    },
  }
})

function renderWithProviders(ui: ReactElement, initialEntries = ['/']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HomePage', () => {
  it('shows the total count of public listings, independent of active filters', async () => {
    renderWithProviders(<HomePage />, ['/?cat=gpu'])

    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('counts child categories across all category families in the hero', async () => {
    renderWithProviders(<HomePage />)

    expect(await screen.findByText('4')).toBeInTheDocument()
  })

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
    await waitFor(() => {
      expect(screen.queryByText('Composants Externes')).toBeNull()
    })
    await waitFor(() => {
      expect(screen.queryByText('Accessoires')).toBeNull()
    })
  })

  it('defers product requests for below-the-fold rows until they approach the viewport', async () => {
    vi.mocked(productService.listProducts).mockClear()
    renderWithProviders(<HomePage />)

    await waitFor(() => expect(productService.listProducts).toHaveBeenCalledTimes(1))
    expect(
      vi.mocked(productService.listProducts).mock.calls.some(([params]) => params?.category)
    ).toBe(false)
  })
})
