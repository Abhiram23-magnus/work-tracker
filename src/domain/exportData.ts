import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import { WORK_STATUS_LABELS } from '../types/work'
import type { Transaction } from '../types/transaction'
import { TRANSACTION_TYPE_LABELS } from '../types/transaction'
import { summarizeWorker } from './calculations'
import { ACCOUNT_STATUS_LABELS } from './accountStatus'
import { paiseToRupees } from '../utils/currency'

/** Plain rows for the spreadsheet and PDF writers. Money is in rupees (numbers) so Excel can sum it. */
export interface ExportTables {
  workers: (string | number)[][]
  work: (string | number)[][]
  money: (string | number)[][]
}

export const WORKER_HEADERS = ['Worker', 'Phone', 'Work type', 'Daily wage (₹)', 'Days worked', 'Earned (₹)', 'Advances (₹)', 'Wages paid (₹)', 'Balance (₹)', 'Account']
export const WORK_HEADERS = ['Date', 'Worker', 'Status', 'Daily wage (₹)', 'Earned (₹)', 'Description']
export const MONEY_HEADERS = ['Date', 'Worker', 'Type', 'Amount (₹)', 'Note']

const byDate = <T extends { date: string }>(items: T[]) => [...items].sort((a, b) => a.date.localeCompare(b.date))

export function buildExportTables(
  workers: Worker[],
  work: WorkRecord[],
  transactions: Transaction[],
  range: { from?: string; to?: string } = {},
): ExportTables {
  const name = new Map(workers.map((w) => [w.id, w.name]))
  const inRange = <T extends { date: string }>(items: T[]) =>
    items.filter((i) => (!range.from || i.date >= range.from) && (!range.to || i.date <= range.to))
  const w = inRange(work)
  const t = inRange(transactions)

  return {
    workers: workers.map((worker) => {
      const s = summarizeWorker(w, t, worker.id)
      return [
        worker.name,
        worker.phone ?? '',
        worker.workType,
        paiseToRupees(worker.dailyWage),
        s.daysWorked,
        paiseToRupees(s.totalEarnings),
        paiseToRupees(s.totalAdvances),
        paiseToRupees(s.totalWagePayments),
        paiseToRupees(s.balance),
        ACCOUNT_STATUS_LABELS[s.status],
      ]
    }),
    work: byDate(w).map((r) => [
      r.date,
      name.get(r.workerId) ?? 'Deleted worker',
      WORK_STATUS_LABELS[r.status],
      paiseToRupees(r.dailyWage),
      paiseToRupees(r.earnedAmount),
      r.description ?? '',
    ]),
    money: byDate(t).map((r) => [
      r.date,
      name.get(r.workerId) ?? 'Deleted worker',
      TRANSACTION_TYPE_LABELS[r.type],
      paiseToRupees(r.amount),
      r.note ?? '',
    ]),
  }
}

/** Rows for one worker's statement, oldest first, with a running balance (earned − paid out). */
export function buildStatement(worker: Worker, work: WorkRecord[], transactions: Transaction[]) {
  type Line = { date: string; text: string; earned: number; paid: number }
  const lines: Line[] = [
    ...work
      .filter((r) => r.workerId === worker.id && r.earnedAmount > 0)
      .map((r) => ({ date: r.date, text: `${WORK_STATUS_LABELS[r.status]}${r.description ? ` – ${r.description}` : ''}`, earned: r.earnedAmount, paid: 0 })),
    ...transactions
      .filter((r) => r.workerId === worker.id)
      .map((r) => ({ date: r.date, text: `${TRANSACTION_TYPE_LABELS[r.type]}${r.note ? ` – ${r.note}` : ''}`, earned: 0, paid: r.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  let balance = 0
  const rows = lines.map((l) => {
    balance += l.earned - l.paid
    return { ...l, balance }
  })
  return { rows, summary: summarizeWorker(work, transactions, worker.id) }
}

/** Safe file name part: "Ramesh K." → "Ramesh-K". */
export function fileSlug(text: string): string {
  return text.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'worker'
}
