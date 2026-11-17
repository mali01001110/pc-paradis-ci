import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import CategoryMegaMenu from './CategoryMegaMenu'
import { I18nProvider } from '@/i18n'

function renderMenu(ui: ReactElement) {
  return render(
    <I18nProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nProvider>
  )
}

describe('CategoryMegaMenu', () => {
  it('links desktop family headers to the products page', () => {
    renderMenu(<CategoryMegaMenu />)

    expect(screen.getByRole('link', { name: 'Composants Internes' })).toHaveAttribute(
      'href',
      '/products?cat=composants-internes'
    )
    expect(screen.getByRole('link', { name: 'Accessoires' })).toHaveAttribute(
      'href',
      '/products?cat=accessoires'
    )
  })

  it('links desktop subcategory items to the products page', () => {
    renderMenu(<CategoryMegaMenu />)

    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Composants Internes' }).parentElement!)

    expect(screen.getByRole('link', { name: 'Processeurs' })).toHaveAttribute('href', '/products?cat=cpu')
    expect(screen.getByRole('link', { name: 'Cartes Graphiques' })).toHaveAttribute('href', '/products?cat=gpu')
  })

  it('links mobile subcategory items to the products page', () => {
    renderMenu(<CategoryMegaMenu isMobile />)

    fireEvent.click(screen.getByRole('button', { name: 'Composants Internes' }))

    expect(screen.getByRole('link', { name: 'Processeurs' })).toHaveAttribute('href', '/products?cat=cpu')

    fireEvent.click(screen.getByRole('button', { name: 'Accessoires' }))
    expect(screen.getByRole('link', { name: 'Câbles & Adaptateurs' })).toHaveAttribute(
      'href',
      '/products?cat=cables'
    )
  })
})
