import type { Page, Route } from '@playwright/test'

export const category = {
  id: 'cat-1',
  name: 'PC Portables',
  slug: 'pc-portables',
  parent: null,
  description: '',
  icon: 'laptop',
  sort_order: 1,
  children: [
    {
      id: 'cat-1-1',
      name: 'Gaming',
      slug: 'pc-gaming',
      parent: 'cat-1',
      description: '',
      icon: 'game',
      sort_order: 1,
      children: [],
    },
  ],
}

export const product = {
  id: 'p-1',
  slug: 'asus-rog-strix-g16',
  title: 'ASUS ROG Strix G16 RTX 4060',
  model: 'G614JV',
  description: 'Portable gaming performant, garantie 12 mois.',
  price: 850000,
  currency: 'FCFA',
  condition: 'NEUF',
  condition_display: 'Neuf',
  status: 'AVAILABLE',
  status_display: 'Disponible',
  city: 'Abidjan',
  commune: 'Cocody',
  phone: '+2250708091011',
  whatsapp: '+2250708091011',
  views_count: 42,
  seller_id: 's-1',
  brand_name: 'ASUS',
  category_slug: 'pc-portables',
  seller_name: 'TechStore Abidjan',
  images: [{ id: 'img-1', image: '/media/test.jpg', is_primary: true, sort_order: 0 }],
  attributes: [
    { id: 'a-1', key: 'ram', label: 'RAM', value: '16 Go' },
    { id: 'a-2', key: 'cpu', label: 'Processeur', value: 'Intel i7-13650HX' },
  ],
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
}

export const productList = {
  count: 1,
  next: null,
  previous: null,
  results: [product],
}

export const seller = {
  id: 's-me-999',
  email: 'vendeur@exemple.ci',
  business_name: 'TechStore Abidjan',
  mfa_enabled: false,
  is_verified: true,
}

export const tokens = { access: 'e2e-access-token', refresh: 'e2e-refresh-token' }

export async function mockApi(page: Page) {
  await page.route('**/api/v1/categories/', (route) =>
    route.fulfill({ json: [category] })
  )
  await page.route('**/api/v1/brands/', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/products/?*', (route) =>
    route.fulfill({ json: productList })
  )
  await page.route('**/api/v1/products/', (route) =>
    route.fulfill({ json: productList })
  )
  await page.route('**/api/v1/products/asus-rog-strix-g16/', (route) =>
    route.fulfill({ json: product })
  )
  await page.route('**/api/v1/products/*/contact/', (route) =>
    route.fulfill({ status: 201, json: { detail: 'Contact enregistré' } })
  )
  await page.route('**/api/v1/auth/me/', (route) =>
    route.fulfill({ json: seller })
  )
  await page.route('**/api/v1/auth/login/', (route) =>
    route.fulfill({ json: tokens })
  )
  await page.route('**/api/v1/contacts/stats/', (route) =>
    route.fulfill({
      json: [
        {
          id: 'p-1',
          title: product.title,
          slug: product.slug,
          total_contacts: 3,
          phone_contacts: 1,
          whatsapp_contacts: 2,
          views_count: 12,
        },
      ],
    })
  )
  await page.route('**/api/v1/products/me/**', (route) =>
    route.fulfill({ json: productList })
  )
  await page.route('**/api/v1/categories/pc-portables/attributes/', (route) =>
    route.fulfill({ json: [] })
  )
}

export async function login(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'e2e-access-token')
    localStorage.setItem('refresh_token', 'e2e-refresh-token')
  })
}
