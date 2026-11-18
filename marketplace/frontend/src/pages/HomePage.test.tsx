import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { productService } from '@/services/productService'
import HomePage from './HomePage'

const publicProductCount = vi.hoisted(() => ({ value: 42 }))

vi.mock('@/services/productService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/productService')>()
  return {
    ...actual,
    productService: {
      ...actual.productService,
      listProducts: vi.fn().mockImplementation((params?: Record<string, string>) =>
        Promise.resolve({
          data: { count: params?.page_size ? publicProductCount.value : 3, next: null, previous: null, results: [] },
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
              { id: '2', name: 'Processeurs', slug: 'cpu', parent: '1', description: '', icon: '', sort_order: 0 },
              { id: '3', name: 'Cartes graphiques', slug: 'gpu', parent: '1', description: '', icon: '', sort_order: 1 },
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
  beforeEach(() => {
    publicProductCount.value = 42
  })

  it('shows the total count of public listings, independent of active filters', async () => {
    renderWithProviders(<HomePage />, ['/?cat=gpu'])

    expect(await screen.findByText('42')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Processeurs/i })).toBeInTheDocument()
  })

  it('shows zero announcements when there are no public products', async () => {
    publicProductCount.value = 0
    renderWithProviders(<HomePage />)

    const announcementStat = screen.getByText('Annonces').parentElement
    expect(await within(announcementStat!).findByText('0')).toBeInTheDocument()
  })

  it('shows the product subcategory count across all families in the hero', async () => {
    renderWithProviders(<HomePage />)

    const subcategoryStat = screen.getByText('Sous-catégories de produits').parentElement
    expect(await screen.findByText('4')).toBeInTheDocument()
    expect(subcategoryStat).toHaveTextContent('4')
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

  it('renders internal subcategory icon links without visible text and excludes other families', async () => {
    renderWithProviders(<HomePage />)
    const processorsLink = await screen.findByRole('link', { name: /Processeurs/ })

    expect(processorsLink).toHaveAttribute('href', '/products?cat=cpu')
    expect(processorsLink).toHaveAttribute('aria-label', 'Processeurs')
    expect(processorsLink.querySelector('svg')).toBeInTheDocument()
    expect(processorsLink).toHaveTextContent('Processeurs')
    expect(screen.getByRole('link', { name: /Cartes graphiques/ })).toHaveAttribute(
      'href',
      '/products?cat=gpu'
    )
    expect(screen.queryByRole('link', { name: /Écrans/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Claviers/ })).toBeNull()
  })

  it('shows a retry state when the category tree fails to load', async () => {
    const { categoryService } = await import('@/services/productService')
    vi.mocked(categoryService.getTree).mockRejectedValueOnce(new Error('network'))

    renderWithProviders(<HomePage />)

    expect(await screen.findByText('network')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('does not expose other categories when internal children are missing', async () => {
    const { categoryService } = await import('@/services/productService')
    const categoryTreeResponse = await categoryService.getTree()
    vi.mocked(categoryService.getTree).mockResolvedValueOnce({
      ...categoryTreeResponse,
      data: [
        {
          id: '1',
          name: 'Composants Internes',
          slug: 'composants-internes',
          parent: null,
          description: '',
          icon: '',
          sort_order: 0,
          children: [],
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
      ],
    })

    renderWithProviders(<HomePage />)

    expect(await screen.findByText('Aucune sous-catégorie de composants internes disponible.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Écrans/ })).toBeNull()
  })

  it('loads only the minimum public product data needed for the hero count', async () => {
    vi.mocked(productService.listProducts).mockClear()
    renderWithProviders(<HomePage />)

    await waitFor(() => expect(productService.listProducts).toHaveBeenCalledTimes(1))
    expect(vi.mocked(productService.listProducts).mock.calls[0][0]).toEqual({ page_size: '1' })
  })
})
