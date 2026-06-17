import { expect, test } from '@playwright/test'

test.describe('/app', () => {
  test('unauthenticated visitors redirect to /login', async ({ page }) => {
    await page.goto('/app')

    await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'Open your decision profile' })).toBeVisible()
  })

  test.describe('authenticated profile rendering', () => {
    test.skip(
      true,
      'Authenticated Supabase Playwright storage state and seeded quiz_response fixtures are not configured in this workspace.',
    )

    test('authenticated user sees latest completed decision profile', async ({ page }) => {
      await page.goto('/app')

      await expect(page.getByRole('heading', { name: 'Decision profile' })).toBeVisible()
      await expect(page.getByText('Latest completed result')).toBeVisible()
    })

    test('woman uses the woman profile image', async ({ page }) => {
      await page.goto('/app')

      await expect(page.getByRole('img', { name: /portrait illustration of a woman/i })).toBeVisible()
      await expect(page.locator('img[src="/images/app-profile-woman.png"]')).toHaveCount(1)
    })

    test('man uses the man profile image', async ({ page }) => {
      await page.goto('/app')

      await expect(page.getByRole('img', { name: /portrait illustration of a man/i })).toBeVisible()
      await expect(page.locator('img[src="/images/app-profile-man.png"]')).toHaveCount(1)
    })

    test('prefer_not_to_say shows no gendered portrait', async ({ page }) => {
      await page.goto('/app')

      await expect(page.getByText('No gendered portrait is shown for this profile.')).toBeVisible()
      await expect(page.getByRole('img')).toHaveCount(0)
    })

    test('mock paywall has Buy', async ({ page }) => {
      await page.goto('/app')

      await expect(page.getByRole('heading', { name: 'Unlock your decision clarity plan' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Buy' })).toBeVisible()
    })
  })
})
