import type { WorkRecord, WorkRecordInput } from '../types/work'
import { earnedAmountFor } from '../domain/calculations'
import { validateWorkRecord } from '../domain/validation'
import { nowTimestamp } from '../utils/dates'
import { getStorage, type StorageService } from './storageService'
import { isWorker, isWorkRecord } from './guards'
import { fail, newId, ok, saveFailed, validationFailed, type Result } from './result'

const newestFirst = (a: WorkRecord, b: WorkRecord) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)

const duplicate = () =>
  fail({ code: 'duplicate', message: 'Work is already recorded for this worker on this date. Edit that entry instead.' })

export function createWorkService(storage: StorageService = getStorage()) {
  const readAll = () => storage.read('workRecords', isWorkRecord)

  return {
    /** Work records, newest date first. Pass a workerId to get one worker's history. */
    async list(workerId?: string): Promise<WorkRecord[]> {
      const records = await readAll()
      return records.filter((r) => !workerId || r.workerId === workerId).sort(newestFirst)
    },

    async get(id: string): Promise<WorkRecord | undefined> {
      return (await readAll()).find((r) => r.id === id)
    },

    /** Earned amount is calculated from the worker's current wage and stored with the record. */
    async create(input: WorkRecordInput): Promise<Result<WorkRecord>> {
      const errors = validateWorkRecord(input)
      if (Object.keys(errors).length) return validationFailed(errors)

      const workers = await storage.read('workers', isWorker)
      const worker = workers.find((w) => w.id === input.workerId)
      if (!worker) return validationFailed({ workerId: 'Please choose a worker.' })

      const records = await readAll()
      if (records.some((r) => r.workerId === input.workerId && r.date === input.date)) return duplicate()

      const now = nowTimestamp()
      const record: WorkRecord = {
        id: newId(),
        workerId: input.workerId,
        date: input.date,
        status: input.status,
        description: input.description?.trim() || undefined,
        earnedAmount: earnedAmountFor(input.status, worker.dailyWage),
        dailyWage: worker.dailyWage,
        createdAt: now,
        updatedAt: now,
      }
      try {
        await storage.write('workRecords', [...records, record])
      } catch (error) {
        return saveFailed(error)
      }
      return ok(record)
    },

    /**
     * Edits date, status or description. Earnings are recalculated from the wage saved on the record,
     * not the worker's current wage, so past entries stay correct after a wage change.
     */
    async update(id: string, changes: Omit<WorkRecordInput, 'workerId'>): Promise<Result<WorkRecord>> {
      const records = await readAll()
      const existing = records.find((r) => r.id === id)
      if (!existing) return fail({ code: 'not-found', message: 'This work entry no longer exists.' })

      const errors = validateWorkRecord({ ...changes, workerId: existing.workerId })
      if (Object.keys(errors).length) return validationFailed(errors)

      const clash = records.some(
        (r) => r.id !== id && r.workerId === existing.workerId && r.date === changes.date,
      )
      if (clash) return duplicate()

      const updated: WorkRecord = {
        ...existing,
        date: changes.date,
        status: changes.status,
        description: changes.description?.trim() || undefined,
        earnedAmount: earnedAmountFor(changes.status, existing.dailyWage),
        updatedAt: nowTimestamp(),
      }
      try {
        await storage.write('workRecords', records.map((r) => (r.id === id ? updated : r)))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(updated)
    },

    async remove(id: string): Promise<Result<void>> {
      const records = await readAll()
      if (!records.some((r) => r.id === id)) {
        return fail({ code: 'not-found', message: 'This work entry no longer exists.' })
      }
      try {
        await storage.write('workRecords', records.filter((r) => r.id !== id))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(undefined)
    },
  }
}

export type WorkService = ReturnType<typeof createWorkService>
