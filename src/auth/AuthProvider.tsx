import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthValue } from './authContext'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import { getStorage } from '../services/storageService'
import { checkStorage } from '../services'
import { createSyncService, type SyncState } from '../services/syncService'


type Phase = { name: 'loading' } | { name: 'signed-out' } | { name: 'signed-in'; session?: Session }

/**
 * Shows `login` until someone is signed in, then points storage at that user's own data and starts
 * syncing. `children` is remounted after a sync brings in changes from another phone.
 */
export function AuthProvider({ login, children }: { login: ReactNode; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(supabase ? { name: 'loading' } : { name: 'signed-in' })
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [dataVersion, setDataVersion] = useState(0)
  const userId = phase.name === 'signed-in' ? phase.session?.user.id : undefined

  useEffect(() => {
    if (!supabase) return
    // getSession reads the saved login from the phone, so it also works offline.
    supabase.auth.getSession().then(({ data }) =>
      setPhase(data.session ? { name: 'signed-in', session: data.session } : { name: 'signed-out' }),
    )
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setPhase(session ? { name: 'signed-in', session } : { name: 'signed-out' }),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  // Scope storage before children render so they never read another user's data.
  const [scopedUser, setScopedUser] = useState<string | null>(null)
  useEffect(() => {
    if (phase.name === 'loading') return
    let active = true
    const storage = getStorage()
    storage.setScope(userId ? `u:${userId}:` : '')
    if (userId) storage.adoptUnscopedData()
    // Read once so damaged records are reported on the first screen.
    checkStorage().then(() => {
      if (!active) return
      setScopedUser(userId ?? '')
      setDataVersion((v) => v + 1)
    })
    return () => {
      active = false
    }
  }, [userId, phase.name])

  useEffect(() => {
    if (!supabase || !userId || scopedUser !== userId) return
    return createSyncService(supabase, getStorage(), userId).start({
      onState: setSyncState,
      onRemoteChange: () => setDataVersion((v) => v + 1),
    })
  }, [userId, scopedUser])

  const value = useMemo<AuthValue>(
    () => ({
      enabled: Boolean(supabase),
      email: phase.name === 'signed-in' ? phase.session?.user.email : undefined,
      syncState,
      signOut: async () => void (await supabase?.auth.signOut()),
    }),
    [phase, syncState],
  )

  if (phase.name === 'loading') return null
  if (phase.name === 'signed-out') return <AuthContext.Provider value={value}>{login}</AuthContext.Provider>
  if (scopedUser !== (userId ?? '')) return null
  return (
    <AuthContext.Provider value={value}>
      <div key={dataVersion} style={{ display: 'contents' }}>
        {children}
      </div>
    </AuthContext.Provider>
  )
}
