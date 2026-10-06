import type { WorkerInput } from '../types/worker'
import { WORK_STATUSES, type WorkRecordInput } from '../types/work'
import { TRANSACTION_TYPES, type TransactionInput } from '../types/transaction'
import { isValidISODate, todayISO } from '../utils/dates'

/** Field name → farmer-readable message. Empty object means valid. */
export type ValidationErrors = Record<string, string>

const isBlank = (value: unknown) => typeof value !== 'string' || value.trim() === ''

const isPositivePaise = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0

const NOT_A_NUMBER = 'Please enter rupees as a number, like 500 or 250.50.'

/** Upper limits that catch typing slips like an extra zero. */
export const MAX_DAILY_WAGE = 1_00_000_00 // ₹1,00,000
export const MAX_AMOUNT = 10_00_000_00 // ₹10,00,000

/** Same calendar check as isValidISODate, plus "not after today". Returns an error message or undefined. */
function dateError(date: unknown, today: string): string | undefined {
  if (!isValidISODate(date)) return 'Please choose a valid date.'
  if (date > today) return 'Date can’t be in the future.'
  return undefined
}

/** Accepts a 10-digit Indian mobile number, optionally with +91/0 prefix, spaces or dashes. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')
  return /^[6-9]\d{9}$/.test(digits)
}

export function validateWorker(input: Partial<WorkerInput>): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.name)) errors.name = 'Please enter the worker’s name.'
  if (isBlank(input.workType)) errors.workType = 'Please enter the type of work.'
  if (Number.isNaN(input.dailyWage)) errors.dailyWage = NOT_A_NUMBER
  else if (!isPositivePaise(input.dailyWage)) errors.dailyWage = 'Daily wage must be more than ₹0.'
  else if (input.dailyWage! > MAX_DAILY_WAGE) errors.dailyWage = 'Daily wage looks too high. Please check the amount.'
  if (!isBlank(input.phone) && !isValidPhone(input.phone!)) {
    errors.phone = 'Please enter a valid 10-digit mobile number.'
  }
  return errors
}

export function validateWorkRecord(input: Partial<WorkRecordInput>, today = todayISO()): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.workerId)) errors.workerId = 'Please choose a worker.'
  const date = dateError(input.date, today)
  if (date) errors.date = date
  if (!WORK_STATUSES.includes(input.status as never)) {
    errors.status = 'Please choose Present, Half Day or Absent.'
  }
  return errors
}

export function validateTransaction(input: Partial<TransactionInput>, today = todayISO()): ValidationErrors {
  const errors: ValidationErrors = {}
  if (isBlank(input.workerId)) errors.workerId = 'Please choose a worker.'
  if (Number.isNaN(input.amount)) errors.amount = NOT_A_NUMBER
  else if (!isPositivePaise(input.amount)) errors.amount = 'Amount must be more than ₹0.'
  else if (input.amount! > MAX_AMOUNT) errors.amount = 'Amount looks too high. Please check it.'
  const date = dateError(input.date, today)
  if (date) errors.date = date
  if (!TRANSACTION_TYPES.includes(input.type as never)) errors.type = 'Please choose Advance or Pay Wages.'
  return errors
}
