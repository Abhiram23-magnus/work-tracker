import { useState, type FormEvent } from 'react'
import { supabase } from '../services/supabaseClient'
import { TextField } from '../components/ui/TextField'
import { Notice } from '../components/ui/Notice'

type Mode = 'sign-in' | 'sign-up'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [info, setInfo] = useState<string>()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setError(undefined)
    setInfo(undefined)
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setBusy(true)
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setError(error.message)
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) setError(error.message)
        else if (!data.session) setInfo('Account created. Check your email to confirm it, then sign in.')
      }
    } catch {
      setError('Could not reach the server. Check your internet connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <main className="app-main">
        <form className="card login-card" onSubmit={submit} noValidate>
          <h1>Worker Tracker</h1>
          <p className="muted">{mode === 'sign-in' ? 'Sign in to your farm notebook.' : 'Create your account.'}</p>
          {error && <Notice>{error}</Notice>}
          {info && <Notice tone="info">{info}</Notice>}
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
          <TextField
            label="Password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={setPassword}
          />
          <button type="submit" className="btn btn-primary btn-block btn-large" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setError(undefined)
              setInfo(undefined)
            }}
          >
            {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </button>
        </form>
      </main>
    </div>
  )
}
