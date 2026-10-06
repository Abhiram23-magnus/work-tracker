import type { Worker } from '../types/worker'
import { WORK_STATUSES, type WorkRecord } from '../types/work'
import { TRANSACTION_TYPES, type Transaction } from '../types/transaction'

// Shape checks for data read back from storage, so a damaged record is skipped instead of crashing the app.

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null
const isStr = (v: unknown): v is string => typeof v === 'string'
const isOptStr = (v: unknown) => v === undefined || isStr(v)
const isPaise = (v: unknown) => typeof v === 'number' && Number.isInteger(v)

const hasBase = (v: Obj) => isStr(v.id) && isStr(v.createdAt) && isStr(v.updatedAt)

export function isWorker(v: unknown): v is Worker {
  return (
    isObj(v) && hasBase(v) && isStr(v.name) && isStr(v.workType) && isOptStr(v.phone) && isPaise(v.dailyWage)
  )
}

export function isWorkRecord(v: unknown): v is WorkRecord {
  return (
    isObj(v) &&
    hasBase(v) &&
    isStr(v.workerId) &&
    isStr(v.date) &&
    WORK_STATUSES.includes(v.status as never) &&
    isOptStr(v.description) &&
    isPaise(v.earnedAmount) &&
    isPaise(v.dailyWage)
  )
}

export function isTransaction(v: unknown): v is Transaction {
  return (
    isObj(v) &&
    hasBase(v) &&
    isStr(v.workerId) &&
    isStr(v.date) &&
    TRANSACTION_TYPES.includes(v.type as never) &&
    isOptStr(v.note) &&
    isPaise(v.amount)
  )
}
