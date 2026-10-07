import { expect, test } from '@playwright/test'
import { FakeSupabase, PASSWORD } from './fake-supabase'
import { newPhone } from './helpers'

// Email sign-in screens against the fake Supabase (see fake-supabase.ts). The real project is
// covered by live.e2e.ts when test accounts are configured.

test('create account, sign out, wrong password, network error, then sign in', async ({ browser }) => {
  const backend = new FakeSupabase()
  const phone = await newPhone(browser, backend, 'phone')
  const { page, errors } = phone

  await page.getByRole('button', { name: 'New here? Create an account' }).click()
  await page.getByLabel('Email').fill('ramesh')
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Enter a valid email address')).toBeVisible()

  await page.getByLabel('Email').fill('  Ramesh@Farm.in ')
  await page.getByLabel('Password').fill('123')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible()
  expect(backend.authRequests).toHaveLength(0)

  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(page.getByText('ramesh@farm.in')).toBeVisible()
  expect(backend.user('ramesh@farm.in')).toBeTruthy()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.getByLabel('Email').fill('ramesh@farm.in')
  await page.getByLabel('Password').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Wrong email or password.')).toBeVisible()

  phone.failNextRequestTo = '/auth/v1/token'
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Could not reach the server.')).toBeVisible()

  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  expect(errors).toEqual([])
})

test('existing email cannot sign up twice', async ({ browser }) => {
  const backend = new FakeSupabase()
  const first = await newPhone(browser, backend, 'first')
  await first.page.getByRole('button', { name: 'New here? Create an account' }).click()
  await first.page.getByLabel('Email').fill('asha@farm.in')
  await first.page.getByLabel('Password').fill(PASSWORD)
  await first.page.getByRole('button', { name: 'Create account' }).click()
  await expect(first.page.getByRole('navigation', { name: 'Main' })).toBeVisible()

  const second = await newPhone(browser, backend, 'second')
  await second.page.getByRole('button', { name: 'New here? Create an account' }).click()
  await second.page.getByLabel('Email').fill('asha@farm.in')
  await second.page.getByLabel('Password').fill('another-pass')
  await second.page.getByRole('button', { name: 'Create account' }).click()
  await expect(second.page.getByText('An account with this email already exists. Sign in instead.')).toBeVisible()
})

test('with email confirmation on: sign-up asks to confirm, sign-in waits until confirmed', async ({ browser }) => {
  const backend = new FakeSupabase({ confirmEmail: true })
  const { page } = await newPhone(browser, backend, 'phone')
  await page.getByRole('button', { name: 'New here? Create an account' }).click()
  await page.getByLabel('Email').fill('sita@farm.in')
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('We sent a confirmation link to sita@farm.in.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Please confirm your email first')).toBeVisible()

  backend.confirm('sita@farm.in')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
})

test('a fast double tap sends only one sign-in request', async ({ browser }) => {
  const backend = new FakeSupabase()
  const { page } = await newPhone(browser, backend, 'phone')
  await page.getByLabel('Email').fill('nobody@farm.in')
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).dblclick()
  await expect(page.getByText('Wrong email or password.')).toBeVisible()
  expect(backend.authRequests).toHaveLength(1)
})
