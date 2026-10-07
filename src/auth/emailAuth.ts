/** Supabase's default minimum password length (Authentication → Providers → Email). */
export const MIN_PASSWORD_LENGTH = 6

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** A light check before calling Supabase; the server has the final say. */
export const isEmailShaped = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))

interface AuthErrorLike {
  code?: string
  status?: number
  message?: string
}

/** Turns a Supabase Auth error into a sentence a farmer can act on. */
export function authErrorMessage(error: AuthErrorLike): string {
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Wrong email or password. Check them and try again.'
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Please confirm your email first: open the link we sent you, then sign in.'
  }
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) {
    return 'An account with this email already exists. Sign in instead.'
  }
  if (code === 'weak_password') return error.message || `Use a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).`
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (code === 'email_provider_disabled' || code === 'signup_disabled') {
    return 'Email sign-up is switched off. Ask the app owner to enable it.'
  }
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'That email address was not accepted. Check it and try again.'
  if (error.status === 0 || message.includes('fetch') || message.includes('network')) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  return error.message || 'Something went wrong. Please try again.'
}
