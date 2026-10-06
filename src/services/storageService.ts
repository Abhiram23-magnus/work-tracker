/**
 * The only module that touches the browser's storage. Everything else asks for collections by name,
 * so localStorage can later be swapped for IndexedDB or a synced backend without changing callers.
 */

/** Minimal key/value backend; window.localStorage satisfies it. */
export interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type CollectionName = 'workers' | 'workRecords' | 'transactions'

export interface StorageService {
  /** Reads a collection. Malformed data never throws: bad JSON gives [], invalid items are skipped. */
  read<T>(collection: CollectionName, isValid: (item: unknown) => item is T): Promise<T[]>
  write<T>(collection: CollectionName, items: T[]): Promise<void>
  /** Collections that had to be repaired on read; the original text is kept under `<key>.corrupt`. */
  recoveredCollections(): CollectionName[]
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
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
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

export function createStorageService(backend: StorageBackend = defaultBackend()): StorageService {
  const recovered = new Set<CollectionName>()

  const quarantine = (collection: CollectionName, raw: string) => {
    recovered.add(collection)
    try {
      backend.setItem(`${KEY_PREFIX}${collection}.corrupt`, raw)
    } catch {
      // Best effort: losing the backup must not stop the app from opening.
    }
  }

  return {
    async read<T>(collection: CollectionName, isValid: (item: unknown) => item is T) {
      let raw: string | null
      try {
        raw = backend.getItem(KEY_PREFIX + collection)
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

    async write<T>(collection: CollectionName, items: T[]) {
      try {
        backend.setItem(KEY_PREFIX + collection, JSON.stringify(items))
      } catch (error) {
        throw new StorageWriteError(error)
      }
    },

    recoveredCollections: () => [...recovered],
  }
}

let shared: StorageService | undefined

/** App-wide storage instance, created on first use. */
export function getStorage(): StorageService {
  shared ??= createStorageService()
  return shared
}
