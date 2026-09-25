import { test, expect } from '@playwright/test'
import { mockApi, tokens } from './mocks'

test('seller login stores tokens and redirects to dashboard', async ({ page }) => {
  await mockApi(page)
  const loginRequests: string[] = []
  await page.route('**/api/v1/auth/login/', async (route) => {
    loginRequests.push(route.request().postData() ?? '')
    await route.fulfill({ json: tokens })
  })
  await page.route('**/api/v1/contacts/stats/', (route) => route.fulfill({ json: [] }))

  await page.goto('/auth/login')
  await page.getByPlaceholder('vendeur@exemple.ci').fill('vendeur@exemple.ci')
  await page.locator('input[type="password"]').fill('S3cur3-Passw0rd!')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect.poll(() => loginRequests.length).toBe(1)
  await expect(page).toHaveURL(/\/seller/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'Vue générale' })).toBeVisible()
})

test('login form shows validation errors when empty', async ({ page }) => {
  await mockApi(page)
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText(/Mot de passe requis/i)).toBeVisible()
})
