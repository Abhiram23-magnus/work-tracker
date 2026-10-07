import { describe, expect, it } from 'vitest'
import { monthlySeries, topOwed } from '../domain/insights'
import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'

const worker = (id: string, name: string): Worker => ({ id, name, workType: 'Field', dailyWage: 50000, createdAt: 't', updatedAt: 't' })
const work = (workerId: string, date: string, earnedAmount: number): WorkRecord => ({
  id: `${workerId}${date}`, workerId, date, status: 'present', earnedAmount, dailyWage: earnedAmount, createdAt: 't', updatedAt: 't',
})
const tx = (workerId: string, date: string, amount: number, type: Transaction['type']): Transaction => ({
  id: `${workerId}${date}${type}`, workerId, date, amount, type, createdAt: 't', updatedAt: 't',
})

describe('monthlySeries', () => {
  it('returns the last months oldest first, crossing a year boundary', () => {
    const months = monthlySeries([], [], '2026-02-10', 4).map((p) => p.month)
    expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('totals earnings, wage payments and advances per month and ignores older months', () => {
    const series = monthlySeries(
      [work('a', '2026-10-01', 50000), work('a', '2026-10-02', 50000), work('a', '2025-01-01', 99999)],
      [tx('a', '2026-10-03', 30000, 'wage-payment'), tx('a', '2026-09-30', 10000, 'advance')],
      '2026-10-07',
      2,
    )
    expect(series).toEqual([
      { month: '2026-09', earned: 0, paid: 0, advanced: 10000 },
      { month: '2026-10', earned: 100000, paid: 30000, advanced: 0 },
    ])
  })
})

describe('topOwed', () => {
  it('lists only workers who are owed money, largest first', () => {
    const rows = topOwed(
      [worker('a', 'Asha'), worker('b', 'Bala'), worker('c', 'Chitra')],
      [work('a', '2026-10-01', 50000), work('b', '2026-10-01', 90000), work('c', '2026-10-01', 10000)],
      [tx('c', '2026-10-02', 40000, 'advance')],
    )
    expect(rows.map((r) => [r.worker.name, r.balance])).toEqual([['Bala', 90000], ['Asha', 50000]])
  })
})
