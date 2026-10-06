import type { ValidationErrors } from '../domain/validation'

export type ServiceErrorCode = 'validation' | 'not-found' | 'duplicate' | 'has-records' | 'storage'

export interface ServiceError {
  code: ServiceErrorCode
  /** Farmer-readable message, safe to show as-is. */
  message: string
  fields?: ValidationErrors
  related?: { workRecords: number; transactions: number }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: ServiceError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const fail = <T = never>(error: ServiceError): Result<T> => ({ ok: false, error })

export const validationFailed = <T = never>(fields: ValidationErrors): Result<T> =>
  fail({ code: 'validation', message: 'Please fix the highlighted fields.', fields })

export const newId = () => crypto.randomUUID()

export const saveFailed = <T = never>(error: unknown): Result<T> =>
  fail({ code: 'storage', message: error instanceof Error ? error.message : 'Could not save.' })
