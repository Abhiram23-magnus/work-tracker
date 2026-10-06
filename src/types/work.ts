import type { Paise } from './worker'

export type WorkStatus = 'present' | 'half-day' | 'absent'

export const WORK_STATUSES: readonly WorkStatus[] = ['present', 'half-day', 'absent']

export interface WorkRecord {
  id: string
  workerId: string
  /** Calendar date, YYYY-MM-DD. */
  date: string
  status: WorkStatus
  description?: string
  /** Calculated when saved; never entered by the farmer. */
  earnedAmount: Paise
  /** Worker's daily wage when the record was created, so later wage changes never alter history. */
  dailyWage: Paise
  createdAt: string
  updatedAt: string
}

export interface WorkRecordInput {
  workerId: string
  date: string
  status: WorkStatus
  description?: string
}

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  present: 'Present',
  'half-day': 'Half Day',
  absent: 'Absent',
}
