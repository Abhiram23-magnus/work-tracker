import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'
import type { AccountStatus } from './accountStatus'
import { summarizeWorker } from './calculations'

export type HistoryEntry =
  | { kind: 'work'; id: string; date: string; workerId: string; record: WorkRecord }
  | { kind: 'money'; id: string; date: string; workerId: string; record: Transaction }

export interface HistoryFilters {
  workerId?: string
  /** YYYY-MM-DD */
  date?: string
  /** Keeps entries of workers whose account is currently in this state. */
  status?: AccountStatus
}

/** Work, advances and wage payments in one list, newest date first, then newest saved first. */
export function buildHistory(
  workers: Worker[],
  work: WorkRecord[],
  transactions: Transaction[],
  filters: HistoryFilters = {},
): HistoryEntry[] {
  const allowedWorkers = new Set(
    workers
      .filter((w) => !filters.workerId || w.id === filters.workerId)
      .filter((w) => !filters.status || summarizeWorker(work, transactions, w.id).status === filters.status)
      .map((w) => w.id),
  )

  const entries: HistoryEntry[] = [
    ...work.map((r) => ({ kind: 'work' as const, id: r.id, date: r.date, workerId: r.workerId, record: r })),
    ...transactions.map((t) => ({ kind: 'money' as const, id: t.id, date: t.date, workerId: t.workerId, record: t })),
  ]

  return entries
    .filter((e) => allowedWorkers.has(e.workerId) && (!filters.date || e.date === filters.date))
    .sort((a, b) => b.date.localeCompare(a.date) || b.record.createdAt.localeCompare(a.record.createdAt))
}

/** Splits a sorted history into consecutive groups by date. */
export function groupByDate(entries: HistoryEntry[]): { date: string; entries: HistoryEntry[] }[] {
  const groups: { date: string; entries: HistoryEntry[] }[] = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (last?.date === entry.date) last.entries.push(entry)
    else groups.push({ date: entry.date, entries: [entry] })
  }
  return groups
}
