import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { FakeSupabase, PASSWORD, type Device } from './fake-supabase'

const openContexts: BrowserContext[] = []
// Each test gets clean phones: close every profile a test opened.
test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((c) => c.close()))
})

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4180/'

export interface Phone extends Device {
  page: Page
  setOffline(offline: boolean): Promise<void>
  errors: string[]
}

/** A fresh browser profile = a separate phone, wired to the shared fake backend. */
export async function newPhone(browser: Browser, backend: FakeSupabase, name: string): Promise<Phone> {
  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 390, height: 844 } })
  openContexts.push(context)
  const device = await backend.attach(context, name)
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('./')
  return Object.assign(device, {
    page,
    errors,
    async setOffline(offline: boolean) {
      device.offline = offline
      await context.setOffline(offline)
    },
  })
}

/** Creates the account the first time, signs in after that (the fake backend has confirmation off by default). */
export async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  const wrong = page.getByText('Wrong email or password.')
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(wrong.or(nav)).toBeVisible()
  if (await wrong.isVisible()) {
    await page.getByRole('button', { name: 'New here? Create an account' }).click()
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()
  }
  await expect(nav).toBeVisible()
}

export async function signOut(page: Page) {
  await page.goto('./')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByLabel('Email')).toBeVisible()
}

export async function addWorker(page: Page, name: string) {
  await page.goto('./#/workers')
  await page.getByRole('button', { name: /\+ Add (your first )?worker/ }).first().click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Work type').fill('Field work')
  await page.getByLabel('Daily wage').fill('500')
  await page.getByRole('button', { name: 'Save worker' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

/** Worker names stored on this phone for the signed-in user. */
export function storedWorkers(page: Page) {
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => /:u:[^:]+:workers$/.test(k))
    return key ? (JSON.parse(localStorage.getItem(key)!) as { name: string }[]).map((w) => w.name).sort() : []
  })
}

/** Triggers the sync the app runs when it comes back to the foreground. */
export async function nudgeSync(page: Page) {
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
}
