import { test, expect } from '@playwright/test'
import { mockApi } from './mocks'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('homepage displays categories and products', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('ASUS ROG Strix G16 RTX 4060').first()).toBeVisible()
})

test('search input navigates with query parameter', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder(/RTX 4070/).fill('rog strix')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/q=rog\+strix|q=rog%20strix/)
})

test('category card navigates to filtered listing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'PC Portables' }).first().click()
  await expect(page).toHaveURL(/cat=pc-/)
})
