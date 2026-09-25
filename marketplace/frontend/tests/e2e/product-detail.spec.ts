import { test, expect } from '@playwright/test'
import { mockApi } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('product page displays details and seller contact', async ({ page }) => {
  await page.goto('/products/asus-rog-strix-g16')
  await expect(page.getByText('ASUS ROG Strix G16 RTX 4060')).toBeVisible()
  await expect(page.getByText('850 000')).toBeVisible()
  await expect(page.getByText(/Appeler \+2250708091011/)).toBeVisible()
  await expect(page.getByText(/WhatsApp \+2250708091011/)).toBeVisible()
})

test('phone contact button records a contact event', async ({ page }) => {
  const contactRequests: string[] = []
  await page.route('**/api/v1/products/asus-rog-strix-g16/contact/', async (route) => {
    contactRequests.push(route.request().postData() ?? '')
    await route.fulfill({ status: 201, json: {} })
  })
  await page.goto('/products/asus-rog-strix-g16')
  await page.getByText(/Appeler \+2250708091011/).click()
  await expect.poll(() => contactRequests.length).toBe(1)
})
