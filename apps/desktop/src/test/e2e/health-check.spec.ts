import { test, expect } from '@playwright/test'

test.describe('Health Check Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects to health check by default', async ({ page }) => {
    await expect(page).toHaveURL(/#\/_health/)
  })

  test('shows the Architecture Health Check heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Architecture Health Check/i })).toBeVisible()
  })

  test('shows all system operational banner after checks load', async ({ page }) => {
    await expect(page.getByText(/All systems operational/i)).toBeVisible({ timeout: 5000 })
  })

  test('displays the Clean Architecture layers', async ({ page }) => {
    await expect(page.getByText('Presentation')).toBeVisible()
    await expect(page.getByText('Application')).toBeVisible()
    await expect(page.getByText('Domain')).toBeVisible()
    await expect(page.getByText('Infrastructure')).toBeVisible()
  })

  test('sidebar is visible with module links', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByTitle('Architecture Health Check')).toBeVisible()
  })
})
