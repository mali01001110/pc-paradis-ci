import { test, expect } from '@playwright/test'
import { mockApi, publicSeller, publicSellerList } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.route('**/api/v1/sellers/', (route) =>
    route.fulfill({ json: publicSellerList })
  )
})

test('sellers page lists verified shops', async ({ page }) => {
  await page.goto('/sellers')
  await expect(page.getByRole('heading', { name: 'Nos vendeurs' })).toBeVisible()
  await expect(page.getByText('TechStore Abidjan').first()).toBeVisible()
  await expect(page.getByText('Abidjan, Cocody')).toBeVisible()
  await expect(page.getByText('12 produits')).toBeVisible()
})

test('seller card links to the shop page', async ({ page }) => {
  await page.goto('/sellers')
  const link = page.locator(`a:has-text("${publicSeller.business_name}")`).first()
  await expect(link).toHaveAttribute('href', /\/shop\/techstore-abidjan/)
})
