import { describe, expect, it } from 'vitest'
import { buildExportTables, buildStatement, fileSlug } from '../domain/exportData'
import type { Worker } from '../types/worker'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'

const worker: Worker = { id: 'w', name: 'Ramesh', workType: 'Field', dailyWage: 50000, createdAt: 't', updatedAt: 't' }
const work: WorkRecord[] = [
  { id: '1', workerId: 'w', date: '2026-10-02', status: 'present', earnedAmount: 50000, dailyWage: 50000, createdAt: 't', updatedAt: 't' },
  { id: '2', workerId: 'w', date: '2026-10-01', status: 'half-day', earnedAmount: 25000, dailyWage: 50000, createdAt: 't', updatedAt: 't' },
]
const tx: Transaction[] = [
  { id: 't1', workerId: 'w', date: '2026-10-03', amount: 20000, type: 'advance', createdAt: 't', updatedAt: 't' },
]

describe('buildExportTables', () => {
  it('writes money in rupees and sorts by date', () => {
    const t = buildExportTables([worker], work, tx)
    expect(t.workers[0]).toEqual(['Ramesh', '', 'Field', 500, 1.5, 750, 200, 0, 550, 'Pending to Pay'])
    expect(t.work.map((r) => r[0])).toEqual(['2026-10-01', '2026-10-02'])
    expect(t.money[0]).toEqual(['2026-10-03', 'Ramesh', 'Advance', 200, ''])
  })

  it('limits rows to the date range', () => {
    const t = buildExportTables([worker], work, tx, { from: '2026-10-02', to: '2026-10-02' })
    expect(t.work).toHaveLength(1)
    expect(t.money).toHaveLength(0)
  })
})

describe('buildStatement', () => {
  it('keeps a running balance in date order', () => {
    const { rows, summary } = buildStatement(worker, work, tx)
    expect(rows.map((r) => r.balance)).toEqual([25000, 75000, 55000])
    expect(summary.balance).toBe(55000)
  })
})

describe('fileSlug', () => {
  it('makes a safe file name', () => {
    expect(fileSlug(' Ramesh K. ')).toBe('Ramesh-K')
    expect(fileSlug('???')).toBe('worker')
  })
})
