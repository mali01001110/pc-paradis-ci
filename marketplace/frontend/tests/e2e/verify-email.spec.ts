import { test, expect } from '@playwright/test'
import { mockApi } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('valid token confirms email and offers login', async ({ page }) => {
  const verifyRequests: string[] = []
  await page.route('**/api/v1/auth/verify-email/**', async (route) => {
    verifyRequests.push(route.request().url())
    await route.fulfill({ json: { detail: 'Email vérifié' } })
  })

  await page.goto('/verify-email/tok123')
  await expect.poll(() => verifyRequests.length).toBeGreaterThanOrEqual(1)
  expect(verifyRequests[0]).toContain('/auth/verify-email/tok123')
  await expect(page.getByText('Email confirmé !')).toBeVisible()
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('invalid token shows error state', async ({ page }) => {
  await page.route('**/api/v1/auth/verify-email/**', (route) =>
    route.fulfill({ status: 400, json: { detail: 'Lien expiré' } })
  )
  await page.goto('/verify-email/bad-token')
  await expect(page.getByText('Lien invalide')).toBeVisible()
  await expect(page.getByText('Lien expiré')).toBeVisible()
})
