import { test, expect } from '@playwright/test'
import { mockApi, login, adminProduct, adminProductList, adminStats, report, reportList } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await login(page)
  await page.route('**/api/v1/contacts/stats/', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/v1/admin/stats/', (route) => route.fulfill({ json: adminStats }))
  await page.route('**/api/v1/admin/products/?*', (route) =>
    route.fulfill({ json: adminProductList })
  )
})

test('moderation queue lists pending products and approves them', async ({ page }) => {
  const moderateRequests: string[] = []
  await page.route(`**/api/v1/admin/products/${adminProduct.id}/moderate/`, async (route) => {
    moderateRequests.push(route.request().postData() ?? '')
    await route.fulfill({ json: { detail: 'Produit approuvé', status: 'AVAILABLE' } })
  })

  await page.goto('/admin/products')
  await expect(page.getByRole('heading', { name: 'Modération produits' })).toBeVisible()
  await expect(page.getByText('En modération').first()).toBeVisible()
  await expect(page.getByText('TechStore Abidjan').first()).toBeVisible()

  await page.getByRole('button', { name: 'Approuver' }).first().click()
  await expect.poll(() => moderateRequests.length).toBe(1)
  expect(JSON.parse(moderateRequests[0]).action).toBe('approve')
})

test('moderation queue shows empty state when nothing to review', async ({ page }) => {
  await page.route('**/api/v1/admin/products/?*', (route) =>
    route.fulfill({ json: { ...adminProductList, count: 0, results: [] } })
  )
  await page.goto('/admin/products')
  await expect(page.getByText('Aucun produit à modérer pour ce filtre.')).toBeVisible()
})

test('reports page marks a report as reviewed', async ({ page }) => {
  await page.route('**/api/v1/reports/?*', (route) => route.fulfill({ json: reportList }))
  await page.route('**/api/v1/reports/', (route) => route.fulfill({ json: reportList }))
  const patchRequests: string[] = []
  await page.route(`**/api/v1/reports/${report.id}/`, async (route) => {
    patchRequests.push(route.request().postData() ?? '')
    await route.fulfill({ json: { ...report, status: 'REVIEWED' } })
  })

  await page.goto('/admin/reports')
  await expect(page.getByRole('heading', { name: /Signalements/ })).toBeVisible()
  await expect(page.getByText('Fraude suspectée')).toBeVisible()
  await expect(page.getByText('1 ouvert')).toBeVisible()

  await page.getByRole('button', { name: 'Traiter' }).click()
  await expect.poll(() => patchRequests.length).toBe(1)
  expect(JSON.parse(patchRequests[0]).status).toBe('REVIEWED')
})
