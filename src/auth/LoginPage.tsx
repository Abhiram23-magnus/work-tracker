import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../services/supabaseClient'
import { TextField } from '../components/ui/TextField'
import { Notice } from '../components/ui/Notice'
import { MIN_PASSWORD_LENGTH, authErrorMessage, isEmailShaped, normalizeEmail } from './emailAuth'

type Mode = 'sign-in' | 'sign-up'

const NETWORK_ERROR = 'Could not reach the server. Check your internet connection and try again.'

/**
 * Email and password sign-in. "Create account" signs up; if the project requires email
 * confirmation, the person confirms from their inbox and then signs in. Once signed in,
 * AuthProvider picks up the session on its own.
 */
export function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [info, setInfo] = useState<string>()
  // Blocks a second request from a fast double tap before React re-renders the disabled button.
  const inFlight = useRef(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || inFlight.current) return
    setError(undefined)
    setInfo(undefined)
    if (!isEmailShaped(email)) return setError('Enter a valid email address, for example name@gmail.com.')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    }

    inFlight.current = true
    setBusy(true)
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password })
        if (error) setError(authErrorMessage(error))
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizeEmail(email),
          password,
          // Bring the confirmation link back to this app, wherever it is hosted.
          options: { emailRedirectTo: window.location.origin + window.location.pathname },
        })
        if (error) setError(authErrorMessage(error))
        else if (!data.session) {
          setMode('sign-in')
          setPassword('')
          setInfo(`Account created. We sent a confirmation link to ${normalizeEmail(email)}. Open it, then sign in here.`)
        }
      }
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
    setError(undefined)
    setInfo(undefined)
  }

  return (
    <div className="app">
      <main className="app-main">
        <form className="card login-card" onSubmit={submit} noValidate>
          <h1>Worker Tracker</h1>
          <p className="muted">{mode === 'sign-in' ? 'Sign in to your farm notebook.' : 'Create your account.'}</p>
          {info && <Notice tone="info">{info}</Notice>}
          {error && <Notice>{error}</Notice>}
          <TextField label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} />
          <TextField
            label="Password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            hint={mode === 'sign-up' ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
            value={password}
            onChange={setPassword}
          />
          <button type="submit" className="btn btn-primary btn-block btn-large" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" className="btn btn-secondary btn-block" disabled={busy} onClick={switchMode}>
            {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </button>
        </form>
      </main>
    </div>
  )
}
