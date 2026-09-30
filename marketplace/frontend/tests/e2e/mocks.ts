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
  is_staff: true,
}

export const tokens = { access: 'e2e-access-token', refresh: 'e2e-refresh-token' }

export const captcha = {
  token: 'e2e-captcha-token',
  question: '12 + 7',
  answer: '19',
}

export const adminProduct = {
  id: 'mp-1',
  slug: 'asus-rog-strix-g16',
  title: 'ASUS ROG Strix G16 RTX 4060',
  model: 'G614JV',
  price: 850000,
  currency: 'FCFA',
  condition: 'NEUF',
  status: 'PENDING_REVIEW' as const,
  city: 'Abidjan',
  views_count: 42,
  is_deleted: false,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  seller: { id: 's-1', email: 'vendeur@exemple.ci', business_name: 'TechStore Abidjan' },
  category: { id: 'cat-1', name: 'PC Portables', slug: 'pc-portables' },
  brand: { id: 'b-1', name: 'ASUS' },
  images: [],
}

export const adminProductList = {
  count: 1,
  next: null,
  previous: null,
  results: [adminProduct],
}

export const adminStats = {
  total_products: 1,
  available: 0,
  sold: 0,
  hidden: 0,
  pending_review: 1,
  rejected: 0,
  deleted: 0,
  total_views: 42,
  top_categories: [],
}

export const report = {
  id: 'r-1',
  product: 'asus-rog-strix-g16',
  product_title: 'ASUS ROG Strix G16 RTX 4060',
  product_slug: 'asus-rog-strix-g16',
  reporter_email: 'client@exemple.ci',
  reason: 'FRAUD' as const,
  description: 'Le vendeur demande un paiement en dehors de la plateforme.',
  status: 'OPEN' as const,
  created_at: '2026-09-10T09:30:00Z',
}

export const reportList = {
  count: 1,
  next: null,
  previous: null,
  results: [report],
}

export const publicSeller = {
  id: 's-1',
  business_name: 'TechStore Abidjan',
  first_name: 'Jean',
  last_name: 'Kouassi',
  city: 'Abidjan',
  commune: 'Cocody',
  shop_name: 'TechStore Abidjan',
  shop_slug: 'techstore-abidjan',
  product_count: 12,
  created_at: '2026-01-01T00:00:00Z',
}

export const publicSellerList = {
  count: 1,
  next: null,
  previous: null,
  results: [publicSeller],
}

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
