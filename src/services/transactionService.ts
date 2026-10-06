import type { Transaction, TransactionInput } from '../types/transaction'
import { validateTransaction } from '../domain/validation'
import { nowTimestamp } from '../utils/dates'
import { getStorage, type StorageService } from './storageService'
import { isTransaction, isWorker } from './guards'
import { fail, newId, ok, saveFailed, validationFailed, type Result } from './result'

const newestFirst = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)

const notFound = () => fail({ code: 'not-found', message: 'This money entry no longer exists.' })

/** Advances and wage payments. Both live here but always keep their own type. */
export function createTransactionService(storage: StorageService = getStorage()) {
  const readAll = () => storage.read('transactions', isTransaction)

  const checkInput = async (input: TransactionInput) => {
    const errors = validateTransaction(input)
    if (Object.keys(errors).length) return errors
    const workers = await storage.read('workers', isWorker)
    if (!workers.some((w) => w.id === input.workerId)) return { workerId: 'Please choose a worker.' }
    return undefined
  }

  return {
    /** Transactions, newest date first. Pass a workerId to get one worker's history. */
    async list(workerId?: string): Promise<Transaction[]> {
      const all = await readAll()
      return all.filter((t) => !workerId || t.workerId === workerId).sort(newestFirst)
    },

    async get(id: string): Promise<Transaction | undefined> {
      return (await readAll()).find((t) => t.id === id)
    },

    async create(input: TransactionInput): Promise<Result<Transaction>> {
      const errors = await checkInput(input)
      if (errors) return validationFailed(errors)

      const now = nowTimestamp()
      const transaction: Transaction = {
        id: newId(),
        workerId: input.workerId,
        amount: input.amount,
        date: input.date,
        type: input.type,
        note: input.note?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      try {
        await storage.write('transactions', [...(await readAll()), transaction])
      } catch (error) {
        return saveFailed(error)
      }
      return ok(transaction)
    },

    async update(id: string, input: TransactionInput): Promise<Result<Transaction>> {
      const all = await readAll()
      const existing = all.find((t) => t.id === id)
      if (!existing) return notFound()

      const errors = await checkInput(input)
      if (errors) return validationFailed(errors)

      const updated: Transaction = {
        ...existing,
        workerId: input.workerId,
        amount: input.amount,
        date: input.date,
        type: input.type,
        note: input.note?.trim() || undefined,
        updatedAt: nowTimestamp(),
      }
      try {
        await storage.write('transactions', all.map((t) => (t.id === id ? updated : t)))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(updated)
    },

    async remove(id: string): Promise<Result<void>> {
      const all = await readAll()
      if (!all.some((t) => t.id === id)) return notFound()
      try {
        await storage.write('transactions', all.filter((t) => t.id !== id))
      } catch (error) {
        return saveFailed(error)
      }
      return ok(undefined)
    },
  }
}

export type TransactionService = ReturnType<typeof createTransactionService>
