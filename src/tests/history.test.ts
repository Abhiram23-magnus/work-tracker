import { describe, expect, it } from 'vitest'
import { buildHistory, groupByDate } from '../domain/history'
import type { AccountStatus } from '../domain/accountStatus'
import { earnedAmountFor } from '../domain/calculations'
import type { Worker } from '../types/worker'
import type { WorkRecord, WorkStatus } from '../types/work'
import type { Transaction, TransactionType } from '../types/transaction'

const worker = (id: string): Worker => ({ id, name: id, workType: 'X', dailyWage: 50000, createdAt: 't', updatedAt: 't' })
const work = (id: string, workerId: string, date: string, status: WorkStatus, createdAt = 't1'): WorkRecord => ({
  id, workerId, date, status, earnedAmount: earnedAmountFor(status, 50000), dailyWage: 50000, createdAt, updatedAt: createdAt,
})
const txn = (id: string, workerId: string, date: string, type: TransactionType, amount: number, createdAt = 't1'): Transaction => ({
  id, workerId, date, type, amount, createdAt, updatedAt: createdAt,
})

// a: earned 1000, paid 0 → pending. b: earned 500, advance 500 → cleared. c: advance 300 → recover.
const workers = [worker('a'), worker('b'), worker('c')]
const records = [work('w1', 'a', '2026-10-01', 'present'), work('w2', 'a', '2026-10-02', 'present'), work('w3', 'b', '2026-10-02', 'present')]
const money = [txn('m1', 'b', '2026-10-01', 'advance', 50000), txn('m2', 'c', '2026-10-03', 'advance', 30000, 't2')]

describe('history', () => {
  it('merges work and money, newest date first', () => {
    expect(buildHistory(workers, records, money).map((e) => e.id)).toEqual(['m2', 'w2', 'w3', 'w1', 'm1'])
  })

  it('breaks same-date ties by newest saved first', () => {
    const later = work('w4', 'c', '2026-10-03', 'absent', 't3')
    expect(buildHistory(workers, [later], money).map((e) => e.id)).toEqual(['w4', 'm2', 'm1'])
  })

  it('filters by worker', () => {
    expect(buildHistory(workers, records, money, { workerId: 'b' }).map((e) => e.id)).toEqual(['w3', 'm1'])
  })

  it('filters by date', () => {
    expect(buildHistory(workers, records, money, { date: '2026-10-02' }).map((e) => e.id).sort()).toEqual(['w2', 'w3'])
  })

  it('filters by account status', () => {
    const ids = (status: AccountStatus) =>
      buildHistory(workers, records, money, { status }).map((e) => e.workerId)
    expect(new Set(ids('pending-to-pay'))).toEqual(new Set(['a']))
    expect(new Set(ids('cleared'))).toEqual(new Set(['b']))
    expect(new Set(ids('advance-to-recover'))).toEqual(new Set(['c']))
  })

  it('combines filters', () => {
    expect(buildHistory(workers, records, money, { workerId: 'a', date: '2026-10-01', status: 'pending-to-pay' }).map((e) => e.id)).toEqual(['w1'])
    expect(buildHistory(workers, records, money, { workerId: 'a', status: 'cleared' })).toEqual([])
  })

  it('groups consecutive entries by date', () => {
    const groups = groupByDate(buildHistory(workers, records, money))
    expect(groups.map((g) => [g.date, g.entries.length])).toEqual([
      ['2026-10-03', 1],
      ['2026-10-02', 2],
      ['2026-10-01', 2],
    ])
  })
})
