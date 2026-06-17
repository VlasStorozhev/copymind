import { expect, test } from '@playwright/test'

test.describe('marketing funnel', () => {
  test('anonymous landing and quiz flow works', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Discover your decision pattern' })).toBeVisible()
    await expect(
      page.getByRole('img', {
        name: /decision paths and a subtle AI twin presence/i,
      }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Start assessment' }).click()
    await expect(page).toHaveURL(/\/quiz$/)
    await expect(
      page.getByRole('heading', {
        name: /who are you creating this profile for\?/i,
      }),
    ).toBeVisible()

    const nextButton = page.getByRole('button', { name: /^Next$/ })
    await expect(nextButton).toBeDisabled()

    await page.getByRole('radio', { name: 'Woman' }).check()
    await expect(nextButton).toBeEnabled()
  })

  test.describe('authenticated state', () => {
    test.skip(true, 'Authenticated Supabase e2e session setup is not configured for this task run')

    test('landing shows sign out and sign out preserves visitor attribution', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
      await page.getByRole('button', { name: 'Sign out' }).click()
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: 'Start assessment' })).toBeVisible()
    })
  })
})
