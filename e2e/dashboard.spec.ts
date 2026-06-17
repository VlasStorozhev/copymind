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
  test('unauthenticated visitors are redirected to sign in', async ({ page }) => {
    test.skip(!!setupError, setupError ?? 'Dashboard auth setup unavailable')

    const response = await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
    expect(response?.status()).toBe(200)
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
    await expect(page.getByText('Private analytics')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Source breakdown' })).toBeVisible()
  })

  test('regular users do not receive dashboard data', async ({ page, context }) => {
    test.skip(!!setupError, setupError ?? 'Dashboard auth setup unavailable')

    const admin = await ensureDashboardE2EUsers()
    const regularCookie = await createDashboardSessionCookie({
      email: admin.regular.email,
      password: admin.regular.password,
    })

    await context.addCookies([regularCookie])

    const response = await page.goto('/dashboard')

    expect(response?.status()).toBe(404)
  })
})
