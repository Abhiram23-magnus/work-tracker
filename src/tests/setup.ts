import { createMemoryBackend, createStorageService, type StorageBackend } from '../services/storageService'
import { createWorkerService } from '../services/workerService'
import { createWorkService } from '../services/workService'
import { createTransactionService } from '../services/transactionService'

/** Fresh services over an in-memory backend. Pass a backend to simulate reopening the app on the same data. */
export function makeServices(backend: StorageBackend = createMemoryBackend()) {
  const storage = createStorageService(backend)
  return {
    backend,
    storage,
    workers: createWorkerService(storage),
    work: createWorkService(storage),
    transactions: createTransactionService(storage),
  }
}

export function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { message: string } }): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
