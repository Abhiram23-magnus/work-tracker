import { useCallback } from 'react'
import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'
import { transactionService, workerService, workService } from '../services'
import { useLoad } from './useLoad'

export interface AppData {
  workers: Worker[]
  work: WorkRecord[]
  transactions: Transaction[]
}

const EMPTY: AppData = { workers: [], work: [], transactions: [] }

/** Everything the dashboard, history and worker list need, loaded together. */
export function useAppData() {
  const load = useCallback(async (): Promise<AppData> => {
    const [workers, work, transactions] = await Promise.all([
      workerService.list(),
      workService.list(),
      transactionService.list(),
    ])
    return { workers, work, transactions }
  }, [])
  const { data, loading, reload } = useLoad(load, EMPTY)
  return { ...data, loading, reload }
}
