import type { WorkerInput } from '../types/worker'
import { WORK_STATUSES, type WorkRecordInput } from '../types/work'
import { TRANSACTION_TYPES, type TransactionInput } from '../types/transaction'
import { isValidISODate } from '../utils/dates'

/** Field name → farmer-readable message. Empty object means valid. */
export type ValidationErrors = Record<string, string>

const isBlank = (value: unknown) => typeof value !== 'string' || value.trim() === ''

const isPositivePaise = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

/** Accepts a 10-digit Indian mobile number, optionally with +91/0 prefix, spaces or dashes. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')
  return /^[6-9]\d{9}$/.test(digits)
}

export function validateWorker(input: Partial<WorkerInput>): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.name)) errors.name = 'Please enter the worker’s name.'
  if (isBlank(input.workType)) errors.workType = 'Please enter the type of work.'
  if (!isPositivePaise(input.dailyWage)) errors.dailyWage = 'Daily wage must be more than ₹0.'
  if (!isBlank(input.phone) && !isValidPhone(input.phone!)) {
    errors.phone = 'Please enter a valid 10-digit mobile number.'
  }
  return errors
}

export function validateWorkRecord(input: Partial<WorkRecordInput>): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.workerId)) errors.workerId = 'Please choose a worker.'
  if (!isValidISODate(input.date)) errors.date = 'Please choose a valid date.'
  if (!WORK_STATUSES.includes(input.status as never)) {
    errors.status = 'Please choose Present, Half Day or Absent.'
  }
  return errors
}

export function validateTransaction(input: Partial<TransactionInput>): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.workerId)) errors.workerId = 'Please choose a worker.'
  if (!isPositivePaise(input.amount)) errors.amount = 'Amount must be more than ₹0.'
  if (!isValidISODate(input.date)) errors.date = 'Please choose a valid date.'
  if (!TRANSACTION_TYPES.includes(input.type as never)) errors.type = 'Please choose Advance or Pay Wages.'
  return errors
}
