import { createWorkerService } from './workerService'
import { createWorkService } from './workService'
import { createTransactionService } from './transactionService'
import { createSettingsService } from './settingsService'

// App-wide service instances. UI code imports these and never touches storage directly.
export const workerService = createWorkerService()
export const workService = createWorkService()
export const transactionService = createTransactionService()
export const settingsService = createSettingsService()
