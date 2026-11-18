import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import CategoriesPage from './CategoriesPage'

vi.mock('@/services/productService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/productService')>()
  return {
    ...actual,
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
              { id: '3', name: 'Cartes Graphiques', slug: 'gpu', parent: '1', description: '', icon: '', sort_order: 1 },
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
              { id: '5', name: 'Écrans Gaming', slug: 'ecrans', parent: '4', description: '', icon: '', sort_order: 0 },
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
              { id: '7', name: 'Câbles', slug: 'cables', parent: '6', description: '', icon: '', sort_order: 0 },
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

describe('CategoriesPage', () => {
  it('renders all three family sections with their subcategory buttons', async () => {
    renderWithProviders(<CategoriesPage />)

    const internes = await screen.findByRole('heading', { name: 'Composants Internes' })
    expect(internes).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Composants Externes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accessoires' })).toBeInTheDocument()

    const internesSection = internes.closest('section')!
    expect(within(internesSection).getByText('Processeurs')).toBeInTheDocument()
    expect(within(internesSection).getByText('Cartes Graphiques')).toBeInTheDocument()

    const externesSection = screen.getByRole('heading', { name: 'Composants Externes' }).closest('section')!
    expect(within(externesSection).getByText('Écrans Gaming')).toBeInTheDocument()

    const accessoiresSection = screen.getByRole('heading', { name: 'Accessoires' }).closest('section')!
    expect(within(accessoiresSection).getByText('Câbles')).toBeInTheDocument()
  })

  it('links subcategories to the products page', async () => {
    renderWithProviders(<CategoriesPage />)

    await screen.findByRole('heading', { name: 'Composants Internes' })
    expect(screen.getByText('Processeurs').closest('a')).toHaveAttribute('href', '/products?cat=cpu')
    expect(screen.getByText('Câbles').closest('a')).toHaveAttribute('href', '/products?cat=cables')
  })

  it('renders family headers as plain text without links', async () => {
    renderWithProviders(<CategoriesPage />)

    const internesHeading = await screen.findByRole('heading', { name: 'Composants Internes' })
    expect(internesHeading.closest('a')).toBeNull()

    const accessoiresHeading = screen.getByRole('heading', { name: 'Accessoires' })
    expect(accessoiresHeading.closest('a')).toBeNull()

    expect(screen.queryByText('Voir les produits')).not.toBeInTheDocument()
  })

  it('scrolls window to top on mount', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    renderWithProviders(<CategoriesPage />)
    await screen.findByRole('heading', { name: 'Composants Internes' })
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    scrollTo.mockRestore()
  })
})
