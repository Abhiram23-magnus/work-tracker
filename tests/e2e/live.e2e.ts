import { expect, test, type Page } from '@playwright/test'
import { BASE_URL } from './helpers'

/**
 * Real Supabase, real phone OTP: no fakes. Skipped unless these are set:
 *   LIVE_PHONE_A, LIVE_CODE_A, LIVE_PHONE_B, LIVE_CODE_B
 * Use Supabase test numbers (Authentication → Sign In / Providers → Phone → "Test phone numbers and OTPs",
 * e.g. 919000000001=123456) so no SMS is sent, or real numbers with LIVE_CODE_* read from the SMS.
 * Numbers are national digits for India, e.g. LIVE_PHONE_A=9000000001.
 * Run against production with E2E_BASE_URL=https://worker-tracker-farm.netlify.app/
 */
const env = process.env
const live = env.LIVE_PHONE_A && env.LIVE_CODE_A && env.LIVE_PHONE_B && env.LIVE_CODE_B
test.skip(!live, 'set LIVE_PHONE_A/B and LIVE_CODE_A/B to run against the real Supabase project')

const REST = 'https://gzvsjkbpuguttmsodoiy.supabase.co/rest/v1/tracker_items'
const KEY = 'sb_publishable_yjMK8lx8oHVzu1Ju34C0Zw_BU3GXo5v'

async function signInLive(page: Page, phone: string, code: string) {
  await page.goto(BASE_URL)
  await page.getByLabel('Mobile number').fill(phone)
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText(/We sent a code by SMS/)).toBeVisible()
  await page.getByLabel('SMS code').fill(code === '000000' ? '111111' : '000000') // a wrong code first
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByText('That code is wrong or has expired.')).toBeVisible()
  await page.getByLabel('SMS code').fill(code)
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  return page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))!
    const session = JSON.parse(localStorage.getItem(key)!)
    return { token: session.access_token as string, userId: session.user.id as string }
  })
}

test('live: phone OTP sign-in and RLS isolation between two real users', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage()
  const b = await (await browser.newContext()).newPage()
  const userA = await signInLive(a, env.LIVE_PHONE_A!, env.LIVE_CODE_A!)
  const userB = await signInLive(b, env.LIVE_PHONE_B!, env.LIVE_CODE_B!)
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
