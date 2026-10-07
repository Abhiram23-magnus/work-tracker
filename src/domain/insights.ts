import type { Paise, Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'
import { summarizeWorker } from './calculations'

export interface MonthPoint {
  /** YYYY-MM */
  month: string
  earned: Paise
  /** Wage payments only; advances are excluded, as on the dashboard totals. */
  paid: Paise
  advanced: Paise
}

/** The last `count` calendar months ending with the month of `today` (YYYY-MM-DD), oldest first. */
export function monthlySeries(
  work: WorkRecord[],
  transactions: Transaction[],
  today: string,
  count = 6,
): MonthPoint[] {
  const [year, month] = today.split('-').map(Number)
  const points: MonthPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    points.push({ month: key, earned: 0, paid: 0, advanced: 0 })
  }
  const byMonth = new Map(points.map((p) => [p.month, p]))
  for (const r of work) {
    const p = byMonth.get(r.date.slice(0, 7))
    if (p) p.earned += r.earnedAmount
  }
  for (const t of transactions) {
    const p = byMonth.get(t.date.slice(0, 7))
    if (!p) continue
    if (t.type === 'wage-payment') p.paid += t.amount
    else p.advanced += t.amount
  }
  return points
}

export interface WorkerBalance {
  worker: Worker
  balance: Paise
  daysWorked: number
}

/** Workers the farmer owes most first (balance above 0). Workers at 0 or owing work are left out. */
export function topOwed(workers: Worker[], work: WorkRecord[], transactions: Transaction[], limit = 5): WorkerBalance[] {
  return workers
    .map((worker) => {
      const s = summarizeWorker(work, transactions, worker.id)
      return { worker, balance: s.balance, daysWorked: s.daysWorked }
    })
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance || a.worker.name.localeCompare(b.worker.name))
    .slice(0, limit)
}

/** "2026-10" → "Oct 26" */
export function shortMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  )
}
