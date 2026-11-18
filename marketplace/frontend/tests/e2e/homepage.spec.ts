import { test, expect } from '@playwright/test'
import { mockApi, productList } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('homepage displays internal subcategory icon cards without loading product rows', async ({ page }) => {
  const requestedCategories: string[] = []
  await page.route('**/api/v1/products/?*', async (route) => {
    const categorySlug = new URL(route.request().url()).searchParams.get('category')
    if (categorySlug) requestedCategories.push(categorySlug)
    await route.fulfill({
      json: categorySlug ? { count: 0, next: null, previous: null, results: [] } : productList,
    })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const processorsCard = page.getByRole('link', { name: 'Processeurs' })
  await expect(processorsCard).toBeVisible()
  await expect(processorsCard.locator('svg')).toBeVisible()
  await expect(page.getByRole('link', { name: 'PC Portables' })).toHaveCount(0)
  await expect(page.getByText('ASUS ROG Strix G16 RTX 4060')).toHaveCount(0)

  for (let step = 0; step < 8; step += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight))
    await page.waitForTimeout(50)
  }
  expect(requestedCategories).toEqual([])
})

test('search input navigates with query parameter', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder(/RTX 4070/).fill('rog strix')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=rog\+strix|q=rog%20strix/)
})

test('subcategory card navigates to filtered listing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Processeurs' }).click()
  await expect(page).toHaveURL(/cat=cpu/)
})
