import type { Paise } from './worker'

/** "advance" is money given against future work; "wage-payment" is money paid against wages already earned. */
export type TransactionType = 'advance' | 'wage-payment'

export const TRANSACTION_TYPES: readonly TransactionType[] = ['advance', 'wage-payment']

export interface Transaction {
  id: string
  workerId: string
  amount: Paise
  /** Calendar date, YYYY-MM-DD. */
  date: string
  type: TransactionType
  note?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionInput {
  workerId: string
  amount: Paise
  date: string
  type: TransactionType
  note?: string
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  advance: 'Advance',
  'wage-payment': 'Wage payment',
}

/** Button and form titles, so farmers never pick a technical "type". */
export const TRANSACTION_ACTION_LABELS: Record<TransactionType, string> = {
  advance: 'Give Advance',
  'wage-payment': 'Pay Wages',
}
