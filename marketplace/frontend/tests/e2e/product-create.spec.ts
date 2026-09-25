import { test, expect } from '@playwright/test'
import { mockApi, login } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await login(page)
  await page.route('**/api/v1/contacts/stats/', (route) => route.fulfill({ json: [] }))
})

test('seller creates a product end to end', async ({ page }) => {
  const created: string[] = []
  await page.route('**/api/v1/products/me/**', async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      created.push(route.request().postData() ?? '')
      await route.fulfill({
        status: 201,
        json: {
          id: 'p-2',
          slug: 'rtx-4070-test',
          title: 'RTX 4070 Test',
          price: 450000,
          status: 'PENDING_REVIEW',
          images: [],
          attributes: [],
        },
      })
    } else {
      await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } })
    }
  })

  await page.goto('/seller/products/new')
  await page.locator('select').nth(0).selectOption({ label: 'PC Portables' })
  await page.locator('select').nth(1).selectOption({ label: 'Gaming' })

  await page.getByPlaceholder(/RTX 4070 Super/).fill('RTX 4070 Test')
  await page.getByPlaceholder('450000').fill('450000')
  await page.getByRole('button', { name: 'Publier le produit' }).click()

  await expect.poll(() => created.length).toBe(1)
  await expect(page).toHaveURL(/\/seller\/products/)
})
