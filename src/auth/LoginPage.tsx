import { useEffect, useId, useState, type FormEvent } from 'react'
import { supabase } from '../services/supabaseClient'
import { TextField } from '../components/ui/TextField'
import { Notice } from '../components/ui/Notice'
import { COUNTRY_CODES, RESEND_COOLDOWN_SECONDS, formatPhone, isOtpShaped, otpErrorMessage, toE164 } from './phone'

const NETWORK_ERROR = 'Could not reach the server. Check your internet connection and try again.'

/**
 * Phone sign-in: enter a number, receive an SMS code, enter the code. The same flow creates the
 * account the first time. Once verified, AuthProvider picks up the new session on its own.
 */
export function LoginPage() {
  const id = useId()
  const [countryCode, setCountryCode] = useState<string>(COUNTRY_CODES[0].code)
  const [number, setNumber] = useState('')
  const [sentTo, setSentTo] = useState<string>()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [info, setInfo] = useState<string>()
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function sendCode(phone: string) {
    if (!supabase) return
    setBusy(true)
    setError(undefined)
    setInfo(undefined)
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) {
        setError(otpErrorMessage(error, 'send'))
        return
      }
      setSentTo(phone)
      setCode('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setInfo(`We sent a code by SMS to ${formatPhone(phone)}.`)
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  function submitPhone(event: FormEvent) {
    event.preventDefault()
    const phone = toE164(countryCode, number)
    if (!phone) return setError('Enter a valid mobile number, for example 98765 43210.')
    void sendCode(phone)
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !sentTo) return
    const token = code.trim()
    if (!isOtpShaped(token)) return setError('Enter the code from the SMS (6 digits).')
    setBusy(true)
    setError(undefined)
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: sentTo, token, type: 'sms' })
      // On success onAuthStateChange in AuthProvider swaps this screen for the app.
      if (error) setError(otpErrorMessage(error, 'verify'))
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  function changeNumber() {
    setSentTo(undefined)
    setCode('')
    setError(undefined)
    setInfo(undefined)
  }

  return (
    <div className="app">
      <main className="app-main">
        {!sentTo ? (
          <form className="card login-card" onSubmit={submitPhone} noValidate>
            <h1>Worker Tracker</h1>
            <p className="muted">Sign in with your mobile number. We will send you a code by SMS.</p>
            {error && <Notice>{error}</Notice>}
            <div className="field">
              <label htmlFor={`${id}-cc`}>Country</label>
              <div className="field-control">
                <select id={`${id}-cc`} value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <TextField
              label="Mobile number"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              prefix={countryCode}
              placeholder="98765 43210"
              value={number}
              onChange={setNumber}
            />
            <button type="submit" className="btn btn-primary btn-block btn-large" disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form className="card login-card" onSubmit={submitCode} noValidate>
            <h1>Enter the code</h1>
            {info && <Notice tone="info">{info}</Notice>}
            {error && <Notice>{error}</Notice>}
            <TextField
              label="SMS code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              placeholder="123456"
              value={code}
              onChange={(v) => setCode(v.replace(/\D/g, ''))}
            />
            <button type="submit" className="btn btn-primary btn-block btn-large" disabled={busy}>
              {busy ? 'Checking…' : 'Verify and sign in'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              disabled={busy || cooldown > 0}
              onClick={() => void sendCode(sentTo)}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={changeNumber}>
              Change number
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
