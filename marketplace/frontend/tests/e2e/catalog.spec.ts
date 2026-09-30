import { test, expect } from '@playwright/test'
import { mockApi, category, product, productList } from './mocks'

const filterOptions = {
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
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.route(`**/api/v1/categories/${category.slug}/filter-options/`, (route) =>
    route.fulfill({ json: filterOptions })
  )
})

test('catalog lists products', async ({ page }) => {
  await page.goto('/products')
  await expect(page.getByRole('heading', { level: 1, name: /catalogue/i })).toBeVisible()
  await expect(page.getByText(product.title).first()).toBeVisible()
})

test('category facet filters via URL params', async ({ page }) => {
  await page.goto(`/products?cat=${category.slug}&attr_vram=8`)
  await expect(page.getByText(product.title).first()).toBeVisible()
  await expect(page).toHaveURL(/attr_vram=8/)
})

test('empty result set shows empty state', async ({ page }) => {
  await page.route('**/api/v1/products/?*', (route) =>
    route.fulfill({ json: { ...productList, count: 0, results: [] } })
  )
  await page.goto('/products')
  await expect(page.getByText(/aucun produit/i)).toBeVisible()
})
