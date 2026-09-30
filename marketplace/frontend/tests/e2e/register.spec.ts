import { test, expect } from '@playwright/test'
import { mockApi, tokens, captcha } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  await page.route('**/api/v1/auth/captcha/', (route) =>
    route.fulfill({ json: captcha })
  )
})

test('seller registers and is redirected to login', async ({ page }) => {
  const registerRequests: string[] = []
  await page.route('**/api/v1/auth/register/', async (route) => {
    registerRequests.push(route.request().postData() ?? '')
    await route.fulfill({ status: 201, json: { detail: 'Compte créé' } })
  })

  await page.goto('/auth/register')
  await page.getByPlaceholder('Jean').fill('Jean')
  await page.getByPlaceholder('Kouassi').fill('Kouassi')
  await page.getByPlaceholder('TechStore Abidjan').fill('TechStore Abidjan')
  await page.getByPlaceholder('vendeur@exemple.ci').fill('nouveau@exemple.ci')
  await page.getByPlaceholder('+2250708091011').nth(0).fill('+2250708091011')
  await page.getByPlaceholder('+2250708091011').nth(1).fill('+2250708091011')
  await page.getByPlaceholder('Min. 8 caractères').fill('S3cur3-Passw0rd!')
  await page.getByPlaceholder('Confirmez').fill('S3cur3-Passw0rd!')
  await page.getByPlaceholder('Votre réponse').fill(captcha.answer)
  await page.locator('input[type="checkbox"]').check()

  await page.getByRole('button', { name: 'Créer mon espace' }).click()

  await expect.poll(() => registerRequests.length).toBe(1)
  const payload = JSON.parse(registerRequests[0])
  expect(payload.captcha_token).toBe(captcha.token)
  expect(payload.captcha_answer).toBe(captcha.answer)
  expect(payload.email).toBe('nouveau@exemple.ci')
  await expect(page).toHaveURL(/\/auth\/login\?registered=true/, { timeout: 10000 })
})

test('register form shows validation errors when empty', async ({ page }) => {
  await page.goto('/auth/register')
  await page.getByRole('button', { name: 'Créer mon espace' }).click()
  await expect(page.getByText('Prénom obligatoire')).toBeVisible()
  await expect(page.getByText('Nom commercial obligatoire')).toBeVisible()
  await expect(page.getByText('Réponse obligatoire')).toBeVisible()
  await expect(page.getByText('Vous devez accepter les CGU')).toBeVisible()
})

test('login page shows welcome banner after registration', async ({ page }) => {
  await page.route('**/api/v1/auth/login/', (route) =>
    route.fulfill({ json: tokens })
  )
  await page.goto('/auth/login?registered=true')
  await expect(page.getByText('Compte créé ! Vérifiez votre email pour activer votre compte.')).toBeVisible()
})
