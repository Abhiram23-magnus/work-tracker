import { describe, expect, it } from 'vitest'
import { diffForPush, mergeRows, type Row } from '../services/syncService'
import { createMemoryBackend, createStorageService } from '../services/storageService'
import { isWorker } from '../services/guards'

const item = (id: string, updatedAt: string) => ({ id, updatedAt })
const row = (id: string, updatedAt: string, deleted = false): Row => ({
  collection: 'workers', id, data: deleted ? null : item(id, updatedAt), deleted, updated_at: 'srv',
})

describe('mergeRows', () => {
  it('adds new items, keeps the newer edit and applies deletions', () => {
    const { items, changed } = mergeRows(
      [item('a', '2026-10-02'), item('b', '2026-10-01'), item('c', '2026-10-01')],
      [row('a', '2026-10-01'), row('b', '2026-10-05'), row('c', '', true), row('d', '2026-10-03')],
    )
    expect(Object.fromEntries(items.map((i) => [i.id, i.updatedAt]))).toEqual({ a: '2026-10-02', b: '2026-10-05', d: '2026-10-03' })
    expect(changed).toBe(true)
  })

  it('reports no change when the phone is already up to date', () => {
    expect(mergeRows([item('a', '2026-10-02')], [row('a', '2026-10-02')]).changed).toBe(false)
  })
})

describe('diffForPush', () => {
  it('uploads new and edited items and deletes what disappeared', () => {
    const { upserts, deletes } = diffForPush(
      [item('a', '1'), item('b', '2'), item('n', '1')],
      { a: '1', b: '1', gone: '1' },
    )
    expect(upserts.map((i) => i.id)).toEqual(['b', 'n'])
    expect(deletes).toEqual(['gone'])
  })
})

describe('per-user storage', () => {
  const worker = { id: '1', name: 'A', workType: 'X', dailyWage: 100, createdAt: 't', updatedAt: 't' }

  it('keeps each user’s data separate on one phone', async () => {
    const storage = createStorageService(createMemoryBackend())
    storage.setScope('u:1:')
    await storage.write('workers', [worker])
    storage.setScope('u:2:')
    expect(await storage.read('workers', isWorker)).toEqual([])
    storage.setScope('u:1:')
    expect(await storage.read('workers', isWorker)).toEqual([worker])
  })

  it('moves pre-login data to the first user only', async () => {
    const storage = createStorageService(createMemoryBackend())
    await storage.write('workers', [worker])
    storage.setScope('u:1:')
    storage.adoptUnscopedData()
    expect(await storage.read('workers', isWorker)).toEqual([worker])
    storage.setScope('u:2:')
    storage.adoptUnscopedData()
    expect(await storage.read('workers', isWorker)).toEqual([])
  })

  it('notifies listeners on normal writes but not silent ones', async () => {
    const storage = createStorageService(createMemoryBackend())
    const seen: string[] = []
    storage.onWrite((c) => seen.push(c))
    await storage.write('workers', [])
    await storage.write('transactions', [], { silent: true })
    expect(seen).toEqual(['workers'])
  })
})
