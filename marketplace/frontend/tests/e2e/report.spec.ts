import { test, expect } from '@playwright/test'
import { mockApi } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('visitor opens report dialog and submits a fraud report', async ({ page }) => {
  const reportRequests: string[] = []
  await page.route('**/api/v1/products/asus-rog-strix-g16/report/', async (route) => {
    reportRequests.push(route.request().postData() ?? '')
    await route.fulfill({ status: 201, json: { detail: 'Signalement enregistré' } })
  })

  await page.goto('/products/asus-rog-strix-g16')
  await page.getByRole('button', { name: 'Signaler' }).click()
  await expect(page.getByText('Signaler cette annonce')).toBeVisible()

  await page.getByLabel('Détails').fill('Le vendeur demande un paiement hors plateforme.')
  await page.getByPlaceholder('vous@exemple.com').fill('client@exemple.ci')
  await page.getByRole('button', { name: 'Envoyer le signalement' }).click()

  await expect.poll(() => reportRequests.length).toBe(1)
  const payload = JSON.parse(reportRequests[0])
  expect(payload.reason).toBe('OTHER')
  expect(payload.reporter_email).toBe('client@exemple.ci')
  await expect(page.getByText("Signalement envoyé. Notre équipe va l'examiner.")).toBeVisible()
})

test('visitor can select a specific report reason', async ({ page }) => {
  const reportRequests: string[] = []
  await page.route('**/api/v1/products/asus-rog-strix-g16/report/', async (route) => {
    reportRequests.push(route.request().postData() ?? '')
    await route.fulfill({ status: 201, json: {} })
  })

  await page.goto('/products/asus-rog-strix-g16')
  await page.getByRole('button', { name: 'Signaler' }).click()
  await page.getByLabel('Motif').selectOption({ label: 'Fraude suspectée' })
  await page.getByRole('button', { name: 'Envoyer le signalement' }).click()

  await expect.poll(() => reportRequests.length).toBe(1)
  expect(JSON.parse(reportRequests[0]).reason).toBe('FRAUD')
})
