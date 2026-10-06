import { describe, expect, it } from 'vitest'
import { createMemoryBackend, createStorageService, type StorageBackend } from '../services/storageService'
import { isWorker } from '../services/guards'
import { summarizeWorker } from '../domain/calculations'
import { makeServices, unwrap } from './setup'

describe('persistence', () => {
  it('keeps workers, work, advances and payments after the app reopens', async () => {
    const backend = createMemoryBackend()
    const first = makeServices(backend)
    const ramesh = unwrap(await first.workers.create({ name: 'Ramesh', workType: 'Field work', dailyWage: 50000 }))
    unwrap(await first.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    unwrap(await first.transactions.create({ workerId: ramesh.id, amount: 20000, date: '2026-10-01', type: 'advance' }))
    unwrap(await first.transactions.create({ workerId: ramesh.id, amount: 10000, date: '2026-10-01', type: 'wage-payment' }))

    const reopened = makeServices(backend)
    expect(await reopened.workers.list()).toEqual([ramesh])
    const summary = summarizeWorker(await reopened.work.list(), await reopened.transactions.list())
    expect(summary).toMatchObject({ totalEarnings: 50000, totalReceived: 30000, balance: 20000 })
  })

  it('treats malformed JSON as empty, keeps a backup and reports it', async () => {
    const backend = createMemoryBackend({ 'worker-tracker:v1:workers': '{not json' })
    const storage = createStorageService(backend)
    expect(await storage.read('workers', isWorker)).toEqual([])
    expect(storage.recoveredCollections()).toEqual(['workers'])
    expect(backend.getItem('worker-tracker:v1:workers.corrupt')).toBe('{not json')
  })

  it('skips damaged records but keeps the good ones', async () => {
    const good = { id: '1', name: 'A', workType: 'X', dailyWage: 100, createdAt: 't', updatedAt: 't' }
    const backend = createMemoryBackend({
      'worker-tracker:v1:workers': JSON.stringify([good, { id: '2', name: 42 }, null]),
    })
    const { workers } = makeServices(backend)
    expect(await workers.list()).toEqual([good])
  })

  it('turns a failed save into a readable error instead of throwing', async () => {
    const full: StorageBackend = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    const result = await makeServices(full).workers.create({ name: 'A', workType: 'X', dailyWage: 100 })
    expect(result).toMatchObject({ ok: false, error: { code: 'storage', message: expect.stringContaining('Could not save') } })
  })
})
