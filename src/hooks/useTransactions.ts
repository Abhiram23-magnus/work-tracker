import { useCallback } from 'react'
import type { Transaction } from '../types/transaction'
import { transactionService } from '../services'
import { useLoad } from './useLoad'

/** One worker's advances and wage payments, newest first. */
export function useTransactions(workerId: string) {
  const load = useCallback(() => transactionService.list(workerId), [workerId])
  const { data, loading, reload } = useLoad<Transaction[]>(load, [])
  return { transactions: data, loading, reload }
}
