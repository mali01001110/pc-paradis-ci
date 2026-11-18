import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CategoryShowcase, catIcon } from './CategoryShowcase'

const childCategorySlugs = [
  'cpu',
  'gpu',
  'carte-mere',
  'ram',
  'stockage',
  'alimentation',
  'boitier',
  'ventilateurs',
  'watercooling',
  'refroidissement-cpu',
  'ecrans',
  'claviers',
  'souris',
  'casques',
  'manettes',
  'volants',
  'joysticks',
  'microphones',
  'webcams',
  'cables',
  'cables-rgb',
  'adaptateurs',
  'accessoires-pc',
  'tables-gaming',
  'chaises-gaming',
  'tapis-de-souris',
]

describe('catIcon', () => {
  it('uses a distinct icon for each catalogue child category', () => {
    const fallbackIcon = catIcon('unknown-category')
    const icons = childCategorySlugs.map(catIcon)

    expect(icons).not.toContain(fallbackIcon)
    expect(new Set(icons).size).toBe(childCategorySlugs.length)
  })
})

describe('CategoryShowcase', () => {
  const categories = [
    { id: '1', name: 'Processeurs', slug: 'cpu', parentName: 'Composants Internes' },
    { id: '2', name: 'Cartes graphiques', slug: 'gpu', parentName: 'Composants Internes' },
  ]

  it('renders labelled cards by default', () => {
    render(
      <MemoryRouter>
        <CategoryShowcase categories={categories} />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Processeurs/ })).toHaveTextContent('Processeurs')
  })

  it('renders icon-only links with accessible names in the icon variant', () => {
    render(
      <MemoryRouter>
        <CategoryShowcase categories={categories} variant="icon" activeSlug="gpu" />
      </MemoryRouter>
    )

    const cpuLink = screen.getByRole('link', { name: 'Processeurs' })
    const gpuLink = screen.getByRole('link', { name: 'Cartes graphiques' })

    expect(cpuLink).toHaveAttribute('href', '/products?cat=cpu')
    expect(cpuLink).toHaveTextContent('Processeurs')
    expect(gpuLink).toHaveAttribute('aria-current', 'page')
  })
})
