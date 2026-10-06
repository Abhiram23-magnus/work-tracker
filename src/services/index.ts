import { createWorkerService } from './workerService'
import { createWorkService } from './workService'
import { createTransactionService } from './transactionService'

// App-wide service instances. UI code imports these and never touches storage directly.
export const workerService = createWorkerService()
export const workService = createWorkService()
export const transactionService = createTransactionService()
