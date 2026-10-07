import { expect, test } from '@playwright/test'

// The production build has no Supabase keys: it must open straight to the dashboard (no login),
// keep data on the phone, and never call a server.
const URL = process.env.E2E_BASE_URL ?? 'http://localhost:4181/'

test('no login: opens on the dashboard, saves on the phone, works offline', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors: string[] = []
  const serverCalls: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => {
    if (/supabase\.co/.test(r.url())) serverCalls.push(r.url())
  })

  await page.goto(URL)
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveCount(0)
  await expect(page.getByText('Sign out')).toHaveCount(0)

  await page.getByRole('link', { name: '+ Add your first worker' }).click()
  await page.getByRole('button', { name: '+ Add your first worker' }).click()
  await page.getByLabel('Name').fill('Ramesh')
  await page.getByLabel('Work type').fill('Field work')
  await page.getByLabel('Daily wage').fill('500')
  await page.getByRole('button', { name: 'Save worker' }).click()
  await expect(page.getByRole('heading', { name: 'Ramesh' })).toBeVisible()

  // Survives a reload, and the dashboard shows the new sections.
  await page.goto(URL)
  await expect(page.getByText('Last 6 months')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export Excel' })).toBeVisible()
  await page.goto(`${URL}#/workers`)
  await expect(page.getByText('Ramesh')).toBeVisible()

  // Offline still works.
  await context.setOffline(true)
  await page.goto(`${URL}#/workers`).catch(() => {})
  await page.reload().catch(() => {})
  await expect(page.getByText('Ramesh')).toBeVisible()
  await context.setOffline(false)

  expect(serverCalls).toEqual([])
  expect(errors).toEqual([])
  await context.close()
})
