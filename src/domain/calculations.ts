import type { Paise, Worker } from '../types/worker'
import type { WorkRecord, WorkStatus } from '../types/work'
import type { Transaction } from '../types/transaction'
import { accountStatusFor, type AccountStatus } from './accountStatus'

/** present = full wage, half-day = half (rounded to the nearest paisa), absent = 0. */
export function earnedAmountFor(status: WorkStatus, dailyWage: Paise): Paise {
  switch (status) {
    case 'present':
      return dailyWage
    case 'half-day':
      return Math.round(dailyWage / 2)
    case 'absent':
      return 0
  }
}

export interface WorkerSummary {
  /** Present days count 1, half days count 0.5. */
  daysWorked: number
  totalEarnings: Paise
  totalAdvances: Paise
  totalWagePayments: Paise
  totalReceived: Paise
  /** totalEarnings - totalReceived. Negative means an advance to recover. */
  balance: Paise
  status: AccountStatus
}

const sum = (values: Paise[]) => values.reduce((total, v) => total + v, 0)

/** Settlement for one worker. Pass only that worker's records, or all records plus the workerId. */
export function summarizeWorker(
  work: WorkRecord[],
  transactions: Transaction[],
  workerId?: string,
): WorkerSummary {
  const w = workerId ? work.filter((r) => r.workerId === workerId) : work
  const t = workerId ? transactions.filter((r) => r.workerId === workerId) : transactions

  const daysWorked = sum(w.map((r) => (r.status === 'present' ? 1 : r.status === 'half-day' ? 0.5 : 0)))
  const totalEarnings = sum(w.map((r) => r.earnedAmount))
  const totalAdvances = sum(t.filter((r) => r.type === 'advance').map((r) => r.amount))
  const totalWagePayments = sum(t.filter((r) => r.type === 'wage-payment').map((r) => r.amount))
  const totalReceived = totalAdvances + totalWagePayments
  const balance = totalEarnings - totalReceived

  return {
    daysWorked,
    totalEarnings,
    totalAdvances,
    totalWagePayments,
    totalReceived,
    balance,
    status: accountStatusFor(balance),
  }
}

export interface DashboardTotals {
  totalWorkers: number
  /** Workers with a present or half-day record today. */
  todaysWorkers: number
  todaysEarnings: Paise
  /** Wage payments only; advances are excluded. */
  todaysPayments: Paise
  totalPendingToPay: Paise
  totalAdvancesToRecover: Paise
}

export function dashboardTotals(
  workers: Worker[],
  work: WorkRecord[],
  transactions: Transaction[],
  today: string,
): DashboardTotals {
  const todaysWork = work.filter((r) => r.date === today)
  const balances = workers.map((worker) => summarizeWorker(work, transactions, worker.id).balance)

  return {
    totalWorkers: workers.length,
    todaysWorkers: new Set(todaysWork.filter((r) => r.status !== 'absent').map((r) => r.workerId)).size,
    todaysEarnings: sum(todaysWork.map((r) => r.earnedAmount)),
    todaysPayments: sum(
      transactions.filter((r) => r.date === today && r.type === 'wage-payment').map((r) => r.amount),
    ),
    totalPendingToPay: sum(balances.map((b) => Math.max(b, 0))),
    totalAdvancesToRecover: sum(balances.map((b) => Math.max(-b, 0))),
  }
}
