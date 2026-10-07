import { describe, expect, it } from 'vitest'
import { formatPhone, isOtpShaped, otpErrorMessage, toE164 } from '../auth/phone'

describe('toE164', () => {
  it('accepts common ways of typing an Indian mobile number', () => {
    for (const typed of ['9876543210', '98765 43210', '098765-43210', '+91 98765 43210', '(98765) 43210']) {
      expect(toE164('+91', typed)).toBe('+919876543210')
    }
  })

  it('rejects numbers that cannot be Indian mobiles', () => {
    expect(toE164('+91', '12345')).toBeNull()
    expect(toE164('+91', '5876543210')).toBeNull() // mobiles start with 6-9
    expect(toE164('+91', '98765432101')).toBeNull()
    expect(toE164('+91', 'abc')).toBeNull()
    expect(toE164('+91', '+44 7700 900123')).toBeNull() // full number with another country code
  })

  it('handles other country codes and the 15-digit limit', () => {
    expect(toE164('+44', '07700 900123')).toBe('+447700900123')
    expect(toE164('+1', '415 555 0100')).toBe('+14155550100')
    expect(toE164('+1', '1234567890123456')).toBeNull()
  })
})

describe('isOtpShaped', () => {
  it('needs 6 to 10 digits', () => {
    expect(isOtpShaped('123456')).toBe(true)
    expect(isOtpShaped('12345')).toBe(false)
    expect(isOtpShaped('12345a')).toBe(false)
  })
})

describe('formatPhone', () => {
  it('formats Supabase phone values for display', () => {
    expect(formatPhone('919876543210')).toBe('+91 98765 43210')
    expect(formatPhone('+447700900123')).toBe('+447700900123')
    expect(formatPhone(undefined)).toBeUndefined()
  })
})

describe('otpErrorMessage', () => {
  it('explains wrong or expired codes', () => {
    expect(otpErrorMessage({ code: 'otp_expired', status: 403, message: 'Token has expired or is invalid' }, 'verify')).toMatch(/wrong or has expired/)
  })
  it('explains rate limits and a disabled phone provider', () => {
    expect(otpErrorMessage({ code: 'over_sms_send_rate_limit', status: 429 }, 'send')).toMatch(/wait a minute/)
    expect(otpErrorMessage({ code: 'phone_provider_disabled', status: 400 }, 'send')).toMatch(/not switched on/)
    expect(otpErrorMessage({ message: 'Unsupported phone provider', status: 400 }, 'send')).toMatch(/not switched on/)
  })
  it('explains network failures', () => {
    expect(otpErrorMessage({ status: 0, message: 'Failed to fetch' }, 'send')).toMatch(/internet connection/)
  })
})
