import type { Worker, WorkerInput } from '../types/worker'
import { validateWorker } from '../domain/validation'
import { nowTimestamp } from '../utils/dates'
import { getStorage, type StorageService } from './storageService'
import { isTransaction, isWorker, isWorkRecord } from './guards'
import { fail, newId, ok, saveFailed, validationFailed, type Result } from './result'

const clean = (input: WorkerInput): WorkerInput => ({
  name: input.name.trim(),
  phone: input.phone?.trim() || undefined,
  workType: input.workType.trim(),
  dailyWage: input.dailyWage,
})

const notFound = () => fail({ code: 'not-found', message: 'This worker no longer exists.' })

export function createWorkerService(storage: StorageService = getStorage()) {
  const readAll = () => storage.read('workers', isWorker)

  async function relatedCounts(id: string) {
    const [work, transactions] = await Promise.all([
      storage.read('workRecords', isWorkRecord),
      storage.read('transactions', isTransaction),
    ])
    return {
      workRecords: work.filter((r) => r.workerId === id).length,
      transactions: transactions.filter((r) => r.workerId === id).length,
    }
  }

  return {
    /** All workers, alphabetical. */
    async list(): Promise<Worker[]> {
      const workers = await readAll()
      return workers.sort((a, b) => a.name.localeCompare(b.name))
    },

    async get(id: string): Promise<Worker | undefined> {
      return (await readAll()).find((w) => w.id === id)
    },

    async create(input: WorkerInput): Promise<Result<Worker>> {
      const errors = validateWorker(input)
      if (Object.keys(errors).length) return validationFailed(errors)

      const now = nowTimestamp()
      const worker: Worker = { id: newId(), ...clean(input), createdAt: now, updatedAt: now }
      try {
        await storage.write('workers', [...(await readAll()), worker])
      } catch (error) {
        return saveFailed(error)
      }
      return ok(worker)
    },

    /** Changing dailyWage affects only new work records; saved records keep their earned amount. */
    async update(id: string, input: WorkerInput): Promise<Result<Worker>> {
      const errors = validateWorker(input)
      if (Object.keys(errors).length) return validationFailed(errors)

      const workers = await readAll()
      const existing = workers.find((w) => w.id === id)
      if (!existing) return notFound()

      const updated: Worker = { ...existing, ...clean(input), updatedAt: nowTimestamp() }
      try {
        await storage.write('workers', workers.map((w) => (w.id === id ? updated : w)))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(updated)
    },

    relatedCounts,

    /**
     * Deletes a worker. If they have work or money records, the call fails with "has-records" unless
     * `withRecords` is true, so history is never removed without the farmer confirming it.
     */
    async remove(id: string, options: { withRecords?: boolean } = {}): Promise<Result<void>> {
      const workers = await readAll()
      if (!workers.some((w) => w.id === id)) return notFound()

      const related = await relatedCounts(id)
      const hasRecords = related.workRecords + related.transactions > 0
      if (hasRecords && !options.withRecords) {
        return fail({
          code: 'has-records',
          message: `This worker has ${related.workRecords} work and ${related.transactions} money records. Deleting will remove them too.`,
          related,
        })
      }

      try {
        if (hasRecords) {
          const [work, transactions] = await Promise.all([
            storage.read('workRecords', isWorkRecord),
            storage.read('transactions', isTransaction),
          ])
          await storage.write('workRecords', work.filter((r) => r.workerId !== id))
          await storage.write('transactions', transactions.filter((r) => r.workerId !== id))
        }
        await storage.write('workers', workers.filter((w) => w.id !== id))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(undefined)
    },
  }
}

export type WorkerService = ReturnType<typeof createWorkerService>
