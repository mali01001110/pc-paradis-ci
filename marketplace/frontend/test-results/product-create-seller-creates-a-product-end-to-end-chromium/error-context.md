# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-create.spec.ts >> seller creates a product end to end
- Location: tests/e2e/product-create.spec.ts:10:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select').first()

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { mockApi, login } from './mocks'
  3  | 
  4  | test.beforeEach(async ({ page }) => {
  5  |   await mockApi(page)
  6  |   await login(page)
  7  |   await page.route('**/api/v1/contacts/stats/', (route) => route.fulfill({ json: [] }))
  8  | })
  9  | 
  10 | test('seller creates a product end to end', async ({ page }) => {
  11 |   const created: string[] = []
  12 |   await page.route('**/api/v1/products/me/**', async (route) => {
  13 |     const method = route.request().method()
  14 |     if (method === 'POST') {
  15 |       created.push(route.request().postData() ?? '')
  16 |       await route.fulfill({
  17 |         status: 201,
  18 |         json: {
  19 |           id: 'p-2',
  20 |           slug: 'rtx-4070-test',
  21 |           title: 'RTX 4070 Test',
  22 |           price: 450000,
  23 |           status: 'PENDING_REVIEW',
  24 |           images: [],
  25 |           attributes: [],
  26 |         },
  27 |       })
  28 |     } else {
  29 |       await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } })
  30 |     }
  31 |   })
  32 | 
  33 |   await page.goto('/seller/products/new')
> 34 |   await page.locator('select').nth(0).selectOption({ label: 'PC Portables' })
     |                                       ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  35 |   await page.locator('select').nth(1).selectOption({ label: 'Gaming' })
  36 | 
  37 |   await page.getByPlaceholder(/RTX 4070 Super/).fill('RTX 4070 Test')
  38 |   await page.getByPlaceholder('450000').fill('450000')
  39 |   await page.getByRole('button', { name: 'Publier le produit' }).click()
  40 | 
  41 |   await expect.poll(() => created.length).toBe(1)
  42 |   await expect(page).toHaveURL(/\/seller\/products/)
  43 | })
  44 | 
```