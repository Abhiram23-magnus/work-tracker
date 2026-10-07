/** Country codes offered on the login screen. India first: most users farm there. */
export const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+977', label: 'Nepal (+977)' },
  { code: '+880', label: 'Bangladesh (+880)' },
  { code: '+94', label: 'Sri Lanka (+94)' },
  { code: '+92', label: 'Pakistan (+92)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+1', label: 'USA / Canada (+1)' },
] as const

/** Seconds before "Resend code" works again; matches Supabase's default limit of one SMS per 60 s. */
export const RESEND_COOLDOWN_SECONDS = 60

/**
 * Builds an E.164 number (+919876543210) from a country code and what the user typed.
 * Spaces, dashes, brackets and one leading 0 (trunk prefix) are ignored. Returns null if it can't be a phone number.
 */
export function toE164(countryCode: string, typed: string): string | null {
  const cc = countryCode.replace(/[^\d]/g, '')
  let national = typed.replace(/[\s\-().]/g, '')
  if (national.startsWith('+')) {
    // The user typed the full international number; trust it if it starts with the chosen code.
    national = national.slice(1)
    if (!national.startsWith(cc)) return null
    national = national.slice(cc.length)
  }
  national = national.replace(/^0/, '')
  if (!/^\d+$/.test(national) || !cc) return null
  const digits = cc + national
  // E.164 allows at most 15 digits; national numbers shorter than 6 digits don't exist.
  if (national.length < 6 || digits.length > 15) return null
  if (cc === '91' && !/^[6-9]\d{9}$/.test(national)) return null
  return `+${digits}`
}

/** Supabase's SMS code length is set in the dashboard (6 by default, up to 10), so accept that whole range. */
export const OTP_MIN_LENGTH = 6
export const OTP_MAX_LENGTH = 10
export const isOtpShaped = (code: string) =>
  new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`).test(code)

/** "+919876543210" → "+91 98765 43210" for display. Other countries keep the plain E.164 form. */
export function formatPhone(e164: string | undefined): string | undefined {
  if (!e164) return undefined
  const plain = e164.startsWith('+') ? e164 : `+${e164}`
  const m = /^\+91(\d{5})(\d{5})$/.exec(plain)
  return m ? `+91 ${m[1]} ${m[2]}` : plain
}

interface AuthErrorLike {
  code?: string
  status?: number
  message?: string
}

/** Turns a Supabase Auth error into a sentence a farmer can act on. */
export function otpErrorMessage(error: AuthErrorLike, step: 'send' | 'verify'): string {
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()
  if (code === 'otp_expired' || message.includes('expired') || message.includes('invalid')) {
    return step === 'verify'
      ? 'That code is wrong or has expired. Check the SMS, or tap "Resend code" for a new one.'
      : 'That phone number was not accepted. Check the country code and number.'
  }
  if (code === 'over_sms_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (code === 'phone_provider_disabled' || code === 'otp_disabled' || message.includes('unsupported phone provider')) {
    return 'Phone sign-in is not switched on yet. Ask the app owner to enable it.'
  }
  if (code === 'sms_send_failed') return 'The SMS could not be sent. Check the number and try again.'
  if (code === 'signup_disabled') return 'New accounts are not allowed right now.'
  if (code === 'validation_failed' || message.includes('phone')) {
    return 'That phone number was not accepted. Check the country code and number.'
  }
  if (error.status === 0 || message.includes('fetch') || message.includes('network')) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  return error.message || 'Something went wrong. Please try again.'
}
