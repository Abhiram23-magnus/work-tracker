import type { SupabaseClient } from '@supabase/supabase-js'
import type { CollectionName, StorageService } from './storageService'
import { isTransaction, isWorker, isWorkRecord } from './guards'

type Item = { id: string; updatedAt: string }
type Guard = (item: unknown) => item is Item

const COLLECTIONS: { name: CollectionName; isValid: Guard }[] = [
  { name: 'workers', isValid: isWorker as Guard },
  { name: 'workRecords', isValid: isWorkRecord as Guard },
  { name: 'transactions', isValid: isTransaction as Guard },
]

export interface Row {
  collection: CollectionName
  id: string
  data: Item | null
  deleted: boolean
  updated_at: string
}

/**
 * Merges rows downloaded from the server into a local list. The newer `updatedAt` wins; a server
 * deletion always removes the local copy. Returns the new list and whether anything changed.
 */
export function mergeRows(local: Item[], rows: Row[]): { items: Item[]; changed: boolean } {
  const byId = new Map(local.map((item) => [item.id, item]))
  let changed = false
  for (const row of rows) {
    if (row.deleted || !row.data) {
      changed = byId.delete(row.id) || changed
      continue
    }
    const current = byId.get(row.id)
    if (!current || current.updatedAt < row.data.updatedAt) {
      byId.set(row.id, row.data)
      changed = true
    }
  }
  return { items: [...byId.values()], changed }
}

/** Items to upload (new or edited since the last upload) and ids to delete (gone since the last upload). */
export function diffForPush(items: Item[], pushed: Record<string, string>) {
  const upserts = items.filter((item) => pushed[item.id] !== item.updatedAt)
  const present = new Set(items.map((item) => item.id))
  const deletes = Object.keys(pushed).filter((id) => !present.has(id))
  return { upserts, deletes }
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

/**
 * Keeps the phone's copy and Supabase in step. The phone stays the source the app reads, so
 * everything works offline; changes upload when the connection is back.
 */
export function createSyncService(client: SupabaseClient, storage: StorageService, userId: string) {
  const stateKey = (part: string) => `sync:${userId}:${part}`
  let running: Promise<boolean> | undefined
  let again = false
  let onState: (state: SyncState) => void = () => {}

  const readJson = async <T>(name: string, fallback: T): Promise<T> => {
    try {
      const raw = await storage.readSetting(name)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }
  const writeJson = (name: string, value: unknown) => storage.writeSetting(name, JSON.stringify(value))

  async function push(name: CollectionName, isValid: Guard) {
    const items = await storage.read(name, isValid)
    const pushed = await readJson<Record<string, string>>(stateKey(`pushed:${name}`), {})
    const { upserts, deletes } = diffForPush(items, pushed)
    if (!upserts.length && !deletes.length) return

    const rows = [
      ...upserts.map((item) => ({ user_id: userId, collection: name, id: item.id, data: item, deleted: false })),
      ...deletes.map((id) => ({ user_id: userId, collection: name, id, data: null, deleted: true })),
    ]
    const { error } = await client.from('tracker_items').upsert(rows, { onConflict: 'user_id,collection,id' })
    if (error) throw error

    const next = { ...pushed }
    for (const item of upserts) next[item.id] = item.updatedAt
    for (const id of deletes) delete next[id]
    await writeJson(stateKey(`pushed:${name}`), next)
  }

  /** Downloads rows changed since the last pull. Returns true if the phone's data changed. */
  async function pull(): Promise<boolean> {
    const since = (await storage.readSetting(stateKey('pulledAt'))) ?? '1970-01-01T00:00:00Z'
    let latest = since
    let changedAny = false
    for (;;) {
      const { data, error } = await client
        .from('tracker_items')
        .select('collection,id,data,deleted,updated_at')
        .gt('updated_at', latest)
        .order('updated_at', { ascending: true })
        .limit(1000)
      if (error) throw error
      const rows = (data ?? []) as Row[]
      if (!rows.length) break

      for (const { name, isValid } of COLLECTIONS) {
        const mine = rows.filter((r) => r.collection === name && (r.deleted || (r.data && isValid(r.data))))
        if (!mine.length) continue
        const local = await storage.read(name, isValid)
        const { items, changed } = mergeRows(local, mine)
        if (changed) {
          await storage.write(name, items, { silent: true })
          changedAny = true
        }
        // What we just downloaded is already on the server, so don't upload it again.
        const pushed = await readJson<Record<string, string>>(stateKey(`pushed:${name}`), {})
        for (const row of mine) {
          if (row.deleted || !row.data) delete pushed[row.id]
          else pushed[row.id] = row.data.updatedAt
        }
        await writeJson(stateKey(`pushed:${name}`), pushed)
      }
      latest = rows[rows.length - 1].updated_at
      await storage.writeSetting(stateKey('pulledAt'), latest)
      if (rows.length < 1000) break
    }
    return changedAny
  }

  async function runOnce(): Promise<boolean> {
    onState('syncing')
    try {
      for (const { name, isValid } of COLLECTIONS) await push(name, isValid)
      const changed = await pull()
      onState('idle')
      return changed
    } catch (error) {
      onState(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error')
      console.warn('Sync failed', error)
      return false
    }
  }

  /** Upload then download. Calls made while a sync is running are folded into one follow-up run. */
  function sync(): Promise<boolean> {
    if (running) {
      again = true
      return running
    }
    running = (async () => {
      let changed = await runOnce()
      while (again) {
        again = false
        changed = (await runOnce()) || changed
      }
      return changed
    })().finally(() => {
      running = undefined
    })
    return running
  }

  return {
    sync,
    /** Starts syncing after local writes and when the connection returns. Call the result to stop. */
    start(callbacks: { onState: (state: SyncState) => void; onRemoteChange: () => void }) {
      onState = callbacks.onState
      let timer: ReturnType<typeof setTimeout> | undefined
      const run = () => void sync().then((changed) => changed && callbacks.onRemoteChange())
      const stopWrite = storage.onWrite(() => {
        clearTimeout(timer)
        timer = setTimeout(run, 800)
      })
      const onOnline = () => run()
      window.addEventListener('online', onOnline)
      const onVisible = () => document.visibilityState === 'visible' && run()
      document.addEventListener('visibilitychange', onVisible)
      run()
      return () => {
        clearTimeout(timer)
        stopWrite()
        window.removeEventListener('online', onOnline)
        document.removeEventListener('visibilitychange', onVisible)
      }
    },
  }
}
