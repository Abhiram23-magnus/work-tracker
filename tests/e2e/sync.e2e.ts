import { expect, test } from '@playwright/test'
import { FakeSupabase } from './fake-supabase'
import { addWorker, newPhone, nudgeSync, signIn, signOut, storedWorkers } from './helpers'

// Multi-user isolation, multi-device sync, offline and logout, all through the real app UI.
// Uses the fake Supabase so it runs without network access; the real RLS policies are checked by
// tests/rls/tracker_items_rls.sql and live.e2e.ts. The SMS rate limit is off here so one number can
// sign in on several phones within a minute (real Supabase would make the second phone wait 60 s).

test('new and existing user: data survives refresh and appears on a second phone', async ({ browser }) => {
  const backend = new FakeSupabase({ smsRateLimit: false })
  const phone1 = await newPhone(browser, backend, 'A1')
  await signIn(phone1.page, '9876543210')
  await addWorker(phone1.page, 'Worker A')
  await phone1.page.reload()
  await expect(phone1.page.getByRole('heading', { name: 'Worker A' })).toBeVisible()

  const userA = backend.user('919876543210')!
  expect(await phone1.page.evaluate((id) => Object.keys(localStorage).some((k) => k.endsWith(`:u:${id}:workers`)), userA.id)).toBe(true)
  await expect.poll(() => backend.rowsFor(userA.id).map((r) => (r.data as { name: string }).name)).toEqual(['Worker A'])

  const phone2 = await newPhone(browser, backend, 'A2')
  await signIn(phone2.page, '+91 98765 43210')
  await expect.poll(() => storedWorkers(phone2.page)).toEqual(['Worker A'])
  expect(backend.users.size).toBe(1)
})

test('two users: each sees only their own workers, and B cannot write as A', async ({ browser }) => {
  const backend = new FakeSupabase({ smsRateLimit: false })
  const a = await newPhone(browser, backend, 'A')
  const b = await newPhone(browser, backend, 'B')
  await signIn(a.page, '9876543210')
  await addWorker(a.page, 'Worker A')
  await signIn(b.page, '9123456789')
  await addWorker(b.page, 'Worker B')
  const userA = backend.user('919876543210')!
  const userB = backend.user('919123456789')!
  expect(userA.id).not.toBe(userB.id)
  await expect.poll(() => backend.rowsFor(userB.id).length).toBe(1)

  await nudgeSync(a.page)
  await nudgeSync(b.page)
  await a.page.waitForTimeout(1000)
  expect(await storedWorkers(a.page)).toEqual(['Worker A'])
  expect(await storedWorkers(b.page)).toEqual(['Worker B'])

  const attack = await b.page.evaluate(async (aId) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))!
    const token = JSON.parse(localStorage.getItem(key)!).access_token
    const base = 'https://gzvsjkbpuguttmsodoiy.supabase.co/rest/v1/tracker_items'
    const headers = { apikey: 'x', authorization: `Bearer ${token}`, 'content-type': 'application/json' }
    const write = await fetch(base, { method: 'POST', headers, body: JSON.stringify([{ user_id: aId, collection: 'workers', id: 'evil', data: {}, deleted: false }]) })
    const read = await fetch(`${base}?select=collection,id,data,deleted,updated_at&updated_at=gt.1970-01-01&order=updated_at.asc&limit=1000`, { headers })
    return { write: write.status, names: ((await read.json()) as { data: { name: string } }[]).map((r) => r.data.name) }
  }, userA.id)
  expect(attack).toEqual({ write: 403, names: ['Worker B'] })
})

test('same user on two phones: changes sync both ways', async ({ browser }) => {
  const backend = new FakeSupabase({ smsRateLimit: false })
  const p1 = await newPhone(browser, backend, 'P1')
  const p2 = await newPhone(browser, backend, 'P2')
  await signIn(p1.page, '9876543210')
  await signIn(p2.page, '9876543210')
  await addWorker(p1.page, 'From phone 1')
  await expect.poll(async () => { await nudgeSync(p2.page); return storedWorkers(p2.page) }).toEqual(['From phone 1'])
  await addWorker(p2.page, 'From phone 2')
  await expect.poll(async () => { await nudgeSync(p1.page); return storedWorkers(p1.page) }).toEqual(['From phone 1', 'From phone 2'])
})

test('offline: saves locally, shows offline status, uploads after reconnecting', async ({ browser }) => {
  const backend = new FakeSupabase({ smsRateLimit: false })
  const p1 = await newPhone(browser, backend, 'P1')
  const p2 = await newPhone(browser, backend, 'P2')
  await signIn(p1.page, '9876543210')
  await signIn(p2.page, '9876543210')
  const user = backend.user('919876543210')!

  await p1.setOffline(true)
  await addWorker(p1.page, 'Offline Worker')
  expect(await storedWorkers(p1.page)).toEqual(['Offline Worker'])
  await p1.page.goto('./')
  await expect(p1.page.getByRole('status').filter({ hasText: 'Offline – will sync when you are back online' })).toBeVisible()
  expect(backend.rowsFor(user.id)).toHaveLength(0)

  await p1.setOffline(false)
  await expect.poll(() => backend.rowsFor(user.id).length).toBe(1)
  await expect(p1.page.getByRole('status').filter({ hasText: 'Saved and synced' })).toBeVisible()
  await expect.poll(async () => { await nudgeSync(p2.page); return storedWorkers(p2.page) }).toEqual(['Offline Worker'])
})

test('logout: login screen guards every page, and the right data loads per user', async ({ browser }) => {
  const backend = new FakeSupabase({ smsRateLimit: false })
  const phone = await newPhone(browser, backend, 'shared')
  await signIn(phone.page, '9876543210')
  await addWorker(phone.page, 'Worker A')
  await signOut(phone.page)

  for (const hash of ['#/', '#/workers', '#/history']) {
    await phone.page.goto(`./${hash}`)
    await expect(phone.page.getByLabel('Mobile number')).toBeVisible()
    await expect(phone.page.getByText('Worker A')).toHaveCount(0)
  }
  expect(await phone.page.evaluate(() => Object.keys(localStorage).some((k) => k.endsWith('-auth-token')))).toBe(false)

  await signIn(phone.page, '9123456789')
  await phone.page.goto('./#/workers')
  await expect(phone.page.getByText('No workers yet')).toBeVisible()
  await signOut(phone.page)

  await signIn(phone.page, '9876543210')
  await phone.page.goto('./#/workers')
  await expect(phone.page.getByText('Worker A')).toBeVisible()
  expect(phone.errors).toEqual([])
})
