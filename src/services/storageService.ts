/**
 * The only module that touches the browser's storage. Everything else asks for collections by name,
 * so localStorage can later be swapped for IndexedDB or a synced backend without changing callers.
 */

/** Minimal key/value backend; window.localStorage satisfies it. */
export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  /** True when data is lost on reload (in-memory fallback). */
  temporary?: boolean
}

export type CollectionName = 'workers' | 'workRecords' | 'transactions'

export interface StorageService {
  /** Reads a collection. Malformed data never throws: bad JSON gives [], invalid items are skipped. */
  read<T>(collection: CollectionName, isValid: (item: unknown) => item is T): Promise<T[]>
  /** `silent` skips change listeners; the sync layer uses it when it writes data it just downloaded. */
  write<T>(collection: CollectionName, items: T[], options?: { silent?: boolean }): Promise<void>
  /** Keeps each signed-in user's data separate on a shared phone. '' is the original single-user area. */
  setScope(scope: string): void
  /** Called after every successful (non-silent) write; returns an unsubscribe function. */
  onWrite(listener: (collection: CollectionName) => void): () => void
  /** Moves data saved before accounts existed into the current scope, once, if the scope is empty. */
  adoptUnscopedData(): void
  /** Collections that had to be repaired on read; the original text is kept under `<key>.corrupt`. */
  recoveredCollections(): CollectionName[]
  /** False when the browser blocks storage and data only lives until the page is closed. */
  readonly persistent: boolean
  /** Small preferences such as the theme. Missing or unreadable values come back as null. */
  readSetting(name: string): Promise<string | null>
  writeSetting(name: string, value: string | null): Promise<void>
}

export class StorageWriteError extends Error {
  constructor(cause: unknown) {
    super('Could not save. Your phone storage may be full.', { cause })
  }
}

const KEY_PREFIX = 'worker-tracker:v1:'

export function createMemoryBackend(initial: Record<string, string> = {}): StorageBackend {
  const data = new Map(Object.entries(initial))
  return {
    temporary: true,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

/** localStorage when it exists and works (it can throw in private mode), otherwise in-memory. */
export function defaultBackend(): StorageBackend {
  try {
    const ls = globalThis.localStorage
    const probe = `${KEY_PREFIX}probe`
    ls.setItem(probe, '1')
    ls.removeItem(probe)
    return ls
  } catch {
    return createMemoryBackend()
  }
}

const COLLECTIONS: CollectionName[] = ['workers', 'workRecords', 'transactions']

export function createStorageService(backend: StorageBackend = defaultBackend()): StorageService {
  const recovered = new Set<CollectionName>()
  const listeners = new Set<(collection: CollectionName) => void>()
  let scope = ''
  const keyFor = (collection: CollectionName) => `${KEY_PREFIX}${scope}${collection}`

  const quarantine = (collection: CollectionName, raw: string) => {
    recovered.add(collection)
    try {
      backend.setItem(`${keyFor(collection)}.corrupt`, raw)
    } catch {
      // Best effort: losing the backup must not stop the app from opening.
    }
  }

  return {
    persistent: !backend.temporary,

    async read<T>(collection: CollectionName, isValid: (item: unknown) => item is T) {
      let raw: string | null
      try {
        raw = backend.getItem(keyFor(collection))
      } catch {
        return []
      }
      if (raw === null) return []

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        quarantine(collection, raw)
        return []
      }
      if (!Array.isArray(parsed)) {
        quarantine(collection, raw)
        return []
      }
      const valid = parsed.filter(isValid)
      if (valid.length !== parsed.length) quarantine(collection, raw)
      return valid
    },

    async write<T>(collection: CollectionName, items: T[], options: { silent?: boolean } = {}) {
      try {
        backend.setItem(keyFor(collection), JSON.stringify(items))
      } catch (error) {
        throw new StorageWriteError(error)
      }
      if (!options.silent) listeners.forEach((listener) => listener(collection))
    },

    setScope(next: string) {
      scope = next
      recovered.clear()
    },

    onWrite(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },

    adoptUnscopedData() {
      if (!scope) return
      try {
        const legacy = COLLECTIONS.map((c) => [c, backend.getItem(`${KEY_PREFIX}${c}`)] as const)
        const hasOwn = COLLECTIONS.some((c) => backend.getItem(keyFor(c)) !== null)
        if (hasOwn || legacy.every(([, raw]) => raw === null)) return
        for (const [c, raw] of legacy) {
          if (raw === null) continue
          backend.setItem(keyFor(c), raw)
          backend.removeItem(`${KEY_PREFIX}${c}`)
        }
      } catch {
        // Best effort: if this fails the user simply starts with an empty account.
      }
    },

    recoveredCollections: () => [...recovered],

    async readSetting(name: string) {
      try {
        return backend.getItem(`${KEY_PREFIX}setting:${name}`)
      } catch {
        return null
      }
    },

    async writeSetting(name: string, value: string | null) {
      try {
        if (value === null) backend.removeItem(`${KEY_PREFIX}setting:${name}`)
        else backend.setItem(`${KEY_PREFIX}setting:${name}`, value)
      } catch (error) {
        throw new StorageWriteError(error)
      }
    },
  }
}

let shared: StorageService | undefined

/** App-wide storage instance, created on first use. */
export function getStorage(): StorageService {
  shared ??= createStorageService()
  return shared
}
