import { useAuth } from '../../auth/authContext'

const SYNC_LABELS = {
  idle: 'Saved and synced',
  syncing: 'Syncing…',
  offline: 'Offline – will sync when you are back online',
  error: 'Could not sync – will retry',
} as const

/** Who is signed in, whether their data is backed up, and a way to sign out. Hidden in local-only mode. */
export function AccountCard() {
  const { enabled, phone, syncState, signOut } = useAuth()
  if (!enabled) return null
  return (
    <>
      <h2 className="section-head">Account</h2>
      <div className="card account-card">
        <p className="small">
          Signed in as <strong>{phone}</strong>
        </p>
        <p className="muted small" role="status">{SYNC_LABELS[syncState]}</p>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </>
  )
}
