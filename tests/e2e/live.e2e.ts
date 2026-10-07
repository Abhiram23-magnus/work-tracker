import { expect, test, type Page } from '@playwright/test'
import { BASE_URL } from './helpers'

/**
 * Real Supabase, real email sign-in: no fakes. Skipped unless these are set:
 *   LIVE_EMAIL_A, LIVE_PASSWORD_A, LIVE_EMAIL_B, LIVE_PASSWORD_B
 * Create the two accounts once in Supabase: Authentication → Users → Add user → Create new user,
 * with "Auto Confirm User" ticked.
 * Run against a deployed site with E2E_BASE_URL=https://abhiram23-magnus.github.io/work-tracker/
 */
const env = process.env
const live = env.LIVE_EMAIL_A && env.LIVE_PASSWORD_A && env.LIVE_EMAIL_B && env.LIVE_PASSWORD_B
test.skip(!live, 'set LIVE_EMAIL_A/B and LIVE_PASSWORD_A/B to run against the real Supabase project')

const REST = 'https://gzvsjkbpuguttmsodoiy.supabase.co/rest/v1/tracker_items'
const KEY = 'sb_publishable_yjMK8lx8oHVzu1Ju34C0Zw_BU3GXo5v'

async function signInLive(page: Page, email: string, password: string) {
  await page.goto(BASE_URL)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(`${password}-wrong`)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Wrong email or password.')).toBeVisible()
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))!
    const session = JSON.parse(localStorage.getItem(key)!)
    return { token: session.access_token as string, userId: session.user.id as string }
  })
}

test('live: email sign-in and RLS isolation between two real users', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage()
  const b = await (await browser.newContext()).newPage()
  const userA = await signInLive(a, env.LIVE_EMAIL_A!, env.LIVE_PASSWORD_A!)
  const userB = await signInLive(b, env.LIVE_EMAIL_B!, env.LIVE_PASSWORD_B!)
  expect(userA.userId).not.toBe(userB.userId)

  const api = (token: string) => async (method: string, query = '', body?: unknown) => {
    const res = await fetch(`${REST}${query}`, {
      method,
      headers: { apikey: KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, rows: text ? JSON.parse(text) : [] }
  }
  const asA = api(userA.token)
  const asB = api(userB.token)
  const rowId = `live-${Date.now()}`

  try {
    expect((await asA('POST', '', [{ user_id: userA.userId, collection: 'workers', id: rowId, data: { name: 'Live A' } }])).status).toBe(201)

    // SELECT
    expect((await asB('GET', `?id=eq.${rowId}`)).rows).toEqual([])
    expect((await asA('GET', `?id=eq.${rowId}`)).rows).toHaveLength(1)
    // INSERT as someone else
    expect((await asB('POST', '', [{ user_id: userA.userId, collection: 'workers', id: `${rowId}-evil`, data: {} }])).status).toBe(403)
    // UPDATE
    expect((await asB('PATCH', `?id=eq.${rowId}`, { data: { name: 'hacked' } })).rows).toEqual([])
    // DELETE
    expect((await asB('DELETE', `?id=eq.${rowId}`)).rows).toEqual([])
    const still = await asA('GET', `?id=eq.${rowId}`)
    expect(still.rows[0].data).toEqual({ name: 'Live A' })
    // Signed-out (anon) sees nothing
    const anon = await fetch(`${REST}?select=id`, { headers: { apikey: KEY } })
    expect(await anon.json()).toEqual([])
  } finally {
    await asA('DELETE', `?id=like.${rowId}*`)
  }
})
