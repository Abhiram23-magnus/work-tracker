import { describe, expect, it } from 'vitest'
import { dashboardTotals, earnedAmountFor, summarizeWorker } from '../domain/calculations'
import { accountStatusFor } from '../domain/accountStatus'
import { isValidPhone, validateTransaction, validateWorker, validateWorkRecord } from '../domain/validation'
import { formatPaise, rupeesToPaise } from '../utils/currency'
import { formatDisplayDate, isValidISODate } from '../utils/dates'
import type { WorkRecord } from '../types/work'
import type { Transaction } from '../types/transaction'
import type { Worker } from '../types/worker'

const ts = '2026-10-01T00:00:00.000Z'
const work = (workerId: string, date: string, status: WorkRecord['status'], wage: number): WorkRecord => ({
  id: `${workerId}-${date}`,
  workerId,
  date,
  status,
  earnedAmount: earnedAmountFor(status, wage),
  dailyWage: wage,
  createdAt: ts,
  updatedAt: ts,
})
const txn = (workerId: string, date: string, type: Transaction['type'], amount: number): Transaction => ({
  id: `${workerId}-${date}-${type}-${amount}`,
  workerId,
  date,
  type,
  amount,
  createdAt: ts,
  updatedAt: ts,
})
const worker = (id: string, dailyWage: number): Worker => ({
  id,
  name: id,
  workType: 'Harvest',
  dailyWage,
  createdAt: ts,
  updatedAt: ts,
})

describe('earnings', () => {
  it('pays full, half or nothing by status', () => {
    expect(earnedAmountFor('present', 50000)).toBe(50000)
    expect(earnedAmountFor('half-day', 50000)).toBe(25000)
    expect(earnedAmountFor('absent', 50000)).toBe(0)
  })

  it('rounds an odd half day to whole paise', () => {
    expect(earnedAmountFor('half-day', 50001)).toBe(25001)
  })
})

describe('account status', () => {
  it('maps balance sign to status', () => {
    expect(accountStatusFor(1)).toBe('pending-to-pay')
    expect(accountStatusFor(0)).toBe('cleared')
    expect(accountStatusFor(-1)).toBe('advance-to-recover')
  })
})

describe('settlement', () => {
  it('keeps advances and wage payments separate and shows negative balances', () => {
    const records = [work('a', '2026-10-01', 'present', 50000), work('a', '2026-10-02', 'half-day', 50000)]
    const money = [txn('a', '2026-10-01', 'advance', 100000)]
    const s = summarizeWorker(records, money)
    expect(s).toMatchObject({
      daysWorked: 1.5,
      totalEarnings: 75000,
      totalAdvances: 100000,
      totalWagePayments: 0,
      totalReceived: 100000,
      balance: -25000,
      status: 'advance-to-recover',
    })
  })

  it('filters by worker when given a workerId', () => {
    const records = [work('a', '2026-10-01', 'present', 50000), work('b', '2026-10-01', 'present', 40000)]
    expect(summarizeWorker(records, [], 'b').totalEarnings).toBe(40000)
  })
})

describe('dashboard', () => {
  it('counts today only, excludes advances from payments, splits pending and recoverable', () => {
    const today = '2026-10-06'
    const workers = [worker('a', 50000), worker('b', 40000), worker('c', 30000)]
    const records = [
      work('a', today, 'present', 50000),
      work('b', today, 'half-day', 40000),
      work('c', today, 'absent', 30000),
      work('a', '2026-10-05', 'present', 50000),
    ]
    const money = [
      txn('a', today, 'wage-payment', 20000),
      txn('b', today, 'advance', 100000),
      txn('a', '2026-10-05', 'wage-payment', 10000),
    ]
    expect(dashboardTotals(workers, records, money, today)).toEqual({
      totalWorkers: 3,
      todaysWorkers: 2,
      todaysEarnings: 70000,
      todaysPayments: 20000,
      totalPendingToPay: 70000, // a: 100000 earned - 30000 paid
      totalAdvancesToRecover: 80000, // b: 20000 earned - 100000 advance
    })
  })
})

describe('validation', () => {
  it('rejects empty name, empty work type and non-positive wage', () => {
    expect(validateWorker({ name: ' ', workType: '', dailyWage: 0 })).toEqual({
      name: expect.any(String),
      workType: expect.any(String),
      dailyWage: expect.any(String),
    })
  })

  it('allows a missing phone but rejects a bad one', () => {
    const base = { name: 'Ramesh', workType: 'Harvest', dailyWage: 50000 }
    expect(validateWorker(base)).toEqual({})
    expect(validateWorker({ ...base, phone: '12345' })).toHaveProperty('phone')
    expect(isValidPhone('+91 98765-43210')).toBe(true)
    expect(isValidPhone('5876543210')).toBe(false)
  })

  it('rejects bad amounts, dates and types', () => {
    const errors = validateTransaction({ workerId: 'a', amount: -5, date: '2026-02-30', type: 'gift' as never })
    expect(Object.keys(errors).sort()).toEqual(['amount', 'date', 'type'])
  })

  it('rejects future dates and amounts that look like typos', () => {
    const ok = { workerId: 'a', amount: 100, date: '2026-10-06', type: 'advance' as const }
    expect(validateTransaction(ok, '2026-10-06')).toEqual({})
    expect(validateTransaction({ ...ok, date: '2026-10-07' }, '2026-10-06')).toHaveProperty('date')
    expect(validateTransaction({ ...ok, amount: 10_00_000_01 }, '2026-10-06')).toHaveProperty('amount')
    expect(validateWorkRecord({ workerId: 'a', status: 'present', date: '2026-10-07' }, '2026-10-06')).toHaveProperty('date')
    expect(validateWorker({ name: 'A', workType: 'B', dailyWage: 1_00_000_01 })).toHaveProperty('dailyWage')
  })

  it('checks real calendar dates', () => {
    expect(isValidISODate('2024-02-29')).toBe(true)
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('06/10/2026')).toBe(false)
  })

  it('formats dates for display without shifting the day', () => {
    expect(formatDisplayDate('2026-10-06')).toMatch(/^Tue, 6 Oct,? 2026$/)
  })
})

describe('currency', () => {
  it('converts rupees to integer paise without float drift', () => {
    expect(rupeesToPaise('0.1')).toBe(10)
    expect(rupeesToPaise(19.99)).toBe(1999)
    expect(rupeesToPaise('1,500')).toBe(150000)
    expect(rupeesToPaise('abc')).toBeNaN()
    expect(rupeesToPaise('')).toBeNaN()
    expect(rupeesToPaise('10.555')).toBeNaN()
    expect(rupeesToPaise('1e3')).toBeNaN()
    expect(rupeesToPaise('500 rs')).toBeNaN()
  })

  it('formats negative balances with the sign', () => {
    expect(formatPaise(-50000)).toBe('-₹500')
    expect(formatPaise(300000)).toBe('₹3,000')
    expect(formatPaise(20050)).toBe('₹200.50')
  })
})
