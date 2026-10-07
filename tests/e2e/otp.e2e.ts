import { expect, test } from '@playwright/test'
import { EXPIRED_CODE, FakeSupabase, VALID_CODE } from './fake-supabase'
import { newPhone } from './helpers'

// Phone OTP sign-in screens against the fake Supabase (see fake-supabase.ts). The real SMS path is
// covered by live.e2e.ts when test phone numbers are configured.

test('phone OTP: validation, wrong code, expired code, network error, then sign in', async ({ browser }) => {
  const backend = new FakeSupabase()
  const phone = await newPhone(browser, backend, 'phone')
  const { page, errors } = phone

  await page.getByLabel('Mobile number').fill('12345')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Enter a valid mobile number')).toBeVisible()
  expect(backend.otpRequests).toHaveLength(0)

  await page.getByLabel('Mobile number').fill('98765 43210')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('We sent a code by SMS to +91 98765 43210.')).toBeVisible()
  expect(backend.otpRequests.map((r) => r.phone)).toEqual(['+919876543210'])

  await page.getByLabel('SMS code').fill('123')
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByText('Enter the full code from the SMS (6 to 10 digits).')).toBeVisible()

  await page.getByLabel('SMS code').fill('111111')
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByText('That code is wrong or has expired.')).toBeVisible()

  await page.getByLabel('SMS code').fill(EXPIRED_CODE)
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByText('That code is wrong or has expired.')).toBeVisible()

  phone.failNextRequestTo = '/auth/v1/verify'
  await page.getByLabel('SMS code').fill(VALID_CODE)
  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByText('Could not reach the server.')).toBeVisible()

  await page.getByRole('button', { name: 'Verify and sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(page.getByText('+91 98765 43210')).toBeVisible()
  expect(errors).toEqual([])
})

test('phone OTP: code length field accepts 6 to 10 digits only', async ({ browser }) => {
  const { page } = await newPhone(browser, new FakeSupabase(), 'phone')
  await page.getByLabel('Mobile number').fill('9876543210')
  await page.getByRole('button', { name: 'Send code' }).click()
  const field = page.getByLabel('SMS code')
  await field.fill('12a34567890123')
  await expect(field).toHaveValue('1234567890') // letters dropped, capped at 10 digits
  await expect(page.getByText('The code is in the SMS we just sent.')).toBeVisible()
})

test('resend: disabled during countdown, re-enabled at zero, sends again, restarts, blocks rapid repeats', async ({ browser }) => {
  const backend = new FakeSupabase()
  const { page } = await newPhone(browser, backend, 'phone')
  await page.clock.install()
  await page.reload()

  const send = page.getByRole('button', { name: 'Send code' })
  await page.getByLabel('Mobile number').fill('9876543210')
  // A fast double tap must send only one SMS.
  await send.dblclick()
  await expect(page.getByLabel('SMS code')).toBeVisible()
  expect(backend.otpRequests).toHaveLength(1)

  const resend = page.getByRole('button', { name: /Resend code/ })
  await expect(resend).toHaveText('Resend code in 60s')
  await expect(resend).toBeDisabled()

  for (let s = 0; s < 30; s++) await page.clock.runFor(1000)
  await expect(resend).toHaveText(/Resend code in 30s/)
  await expect(resend).toBeDisabled()
  await resend.click({ force: true }) // clicking a disabled button does nothing
  expect(backend.otpRequests).toHaveLength(1)

  // Going back and entering the same number does not skip the wait.
  await page.getByRole('button', { name: 'Change number' }).click()
  await page.getByLabel('Mobile number').fill('98765 43210')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText(/A code was already sent to \+91 98765 43210/)).toBeVisible()
  expect(backend.otpRequests).toHaveLength(1)

  for (let s = 0; s < 30; s++) await page.clock.runFor(1000)
  await expect(resend).toHaveText('Resend code')
  await expect(resend).toBeEnabled()

  // Real time must also pass for the fake server's 60 s limit; move its view of time forward.
  backend.otpRequests[0].at -= 61_000
  await resend.click()
  await expect(resend).toHaveText('Resend code in 60s')
  await expect(resend).toBeDisabled()
  expect(backend.otpRequests).toHaveLength(2)
  await expect(page.getByText('We sent a code by SMS to +91 98765 43210.')).toBeVisible()
})

test('resend: server rate limit is shown clearly', async ({ browser }) => {
  const backend = new FakeSupabase()
  const { page } = await newPhone(browser, backend, 'phone')
  // Another phone asked for a code for this number a moment ago.
  backend.otpRequests.push({ device: 'other', phone: '+919876543210', at: Date.now() })
  await page.getByLabel('Mobile number').fill('9876543210')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('Too many attempts. Please wait a minute and try again.')).toBeVisible()
  await expect(page.getByLabel('Mobile number')).toBeVisible()
})
