import { getStorage } from './storageService'
import { createWorkerService } from './workerService'
import { createWorkService } from './workService'
import { createTransactionService } from './transactionService'
import { createSettingsService } from './settingsService'

// App-wide service instances. UI code imports these and never touches storage directly.
export const workerService = createWorkerService()
export const workService = createWorkService()
export const transactionService = createTransactionService()
export const settingsService = createSettingsService()

/** Whether saving works on this phone and whether any saved data had to be skipped as damaged. */
export function storageStatus() {
  const storage = getStorage()
  return { persistent: storage.persistent, recovered: storage.recoveredCollections() }
}

/** Reads every collection once so damaged data is detected before the first screen shows. */
export async function checkStorage() {
  await Promise.all([workerService.list(), workService.list(), transactionService.list()])
  return storageStatus()
}
