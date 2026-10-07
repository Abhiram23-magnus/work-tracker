import { describe, expect, it } from 'vitest'
import { authErrorMessage, isEmailShaped, normalizeEmail } from '../auth/emailAuth'

describe('email helpers', () => {
  it('trims and lower-cases emails', () => {
    expect(normalizeEmail('  Ramesh@Gmail.COM ')).toBe('ramesh@gmail.com')
  })
  it('accepts normal emails and rejects obvious mistakes', () => {
    expect(isEmailShaped('ramesh@gmail.com')).toBe(true)
    expect(isEmailShaped(' a.b+farm@example.co.in ')).toBe(true)
    for (const bad of ['', 'ramesh', 'ramesh@', 'ramesh@gmail', 'ra mesh@gmail.com']) expect(isEmailShaped(bad)).toBe(false)
  })
})

describe('authErrorMessage', () => {
  it('explains wrong credentials and unconfirmed email', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' })).toMatch(/Wrong email or password/)
    expect(authErrorMessage({ code: 'email_not_confirmed', status: 400 })).toMatch(/confirm your email/)
  })
  it('explains existing accounts, rate limits and disabled sign-up', () => {
    expect(authErrorMessage({ code: 'user_already_exists', status: 422 })).toMatch(/already exists/)
    expect(authErrorMessage({ message: 'User already registered', status: 400 })).toMatch(/already exists/)
    expect(authErrorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toMatch(/wait a few minutes/)
    expect(authErrorMessage({ code: 'signup_disabled', status: 422 })).toMatch(/switched off/)
  })
  it('explains network failures', () => {
    expect(authErrorMessage({ status: 0, message: 'Failed to fetch' })).toMatch(/internet connection/)
  })
})
