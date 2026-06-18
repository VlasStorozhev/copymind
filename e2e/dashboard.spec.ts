import { expect, test } from '@playwright/test'

import { createDashboardSessionCookie, ensureDashboardE2EUsers } from '@/tests/e2e/dashboardAuth'

let setupError: string | null = null

test.beforeAll(async () => {
  try {
    await ensureDashboardE2EUsers()
  } catch (error) {
    setupError = error instanceof Error ? error.message : String(error)
  }
})

test.describe('/dashboard', () => {
  test('unauthenticated visitors see the sign-in required state', async ({ page }) => {
    test.skip(!!setupError, setupError ?? 'Dashboard auth setup unavailable')

    const response = await page.goto('/dashboard')

    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sign in required' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('active admins can open the dashboard', async ({ page, context }) => {
    test.skip(!!setupError, setupError ?? 'Dashboard auth setup unavailable')

    const admin = await ensureDashboardE2EUsers()
    const adminCookie = await createDashboardSessionCookie({
      email: admin.admin.email,
      password: admin.admin.password,
    })

    await context.addCookies([adminCookie])

    const response = await page.goto('/dashboard')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(page.getByText('Private analytics')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Source breakdown' })).toBeVisible()
  })

  test('regular users see the admin access required state', async ({ page, context }) => {
    test.skip(!!setupError, setupError ?? 'Dashboard auth setup unavailable')

    const admin = await ensureDashboardE2EUsers()
    const regularCookie = await createDashboardSessionCookie({
      email: admin.regular.email,
      password: admin.regular.password,
    })

    await context.addCookies([regularCookie])

    const response = await page.goto('/dashboard')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Admin access required' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Source breakdown' })).toHaveCount(0)
  })
})
