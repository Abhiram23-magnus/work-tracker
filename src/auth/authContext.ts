import { createContext, useContext } from 'react'
import type { SyncState } from '../services/syncService'

export interface AuthValue {
  /** False when no Supabase project is configured (local-only mode). */
  enabled: boolean
  /** Signed-in phone number, formatted for display. */
  phone?: string
  syncState: SyncState
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue>({ enabled: false, syncState: 'idle', signOut: async () => {} })
export const useAuth = () => useContext(AuthContext)
