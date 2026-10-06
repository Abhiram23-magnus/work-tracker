import { beforeEach, describe, expect, it } from 'vitest'
import { summarizeWorker } from '../domain/calculations'
import { makeServices, unwrap } from './setup'

let s: ReturnType<typeof makeServices>

beforeEach(() => {
  s = makeServices()
})

const addRamesh = () =>
  s.workers.create({ name: 'Ramesh', workType: 'Field work', dailyWage: 50000 }).then(unwrap)

describe('Ramesh scenario', () => {
  it('moves from pending to cleared to advance-to-recover', async () => {
    const ramesh = await addRamesh()
    unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 200000, date: '2026-10-01', type: 'advance' }))
    for (let day = 1; day <= 6; day++) {
      unwrap(await s.work.create({ workerId: ramesh.id, date: `2026-10-0${day}`, status: 'present' }))
    }
    unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 50000, date: '2026-10-06', type: 'wage-payment' }))

    const summary = async () => summarizeWorker(await s.work.list(ramesh.id), await s.transactions.list(ramesh.id))

    expect(await summary()).toMatchObject({
      daysWorked: 6,
      totalEarnings: 300000,
      totalAdvances: 200000,
      totalWagePayments: 50000,
      totalReceived: 250000,
      balance: 50000,
      status: 'pending-to-pay',
    })

    unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 50000, date: '2026-10-06', type: 'wage-payment' }))
    expect(await summary()).toMatchObject({ balance: 0, status: 'cleared' })

    unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 50000, date: '2026-10-07', type: 'wage-payment' }))
    expect(await summary()).toMatchObject({ balance: -50000, status: 'advance-to-recover' })
  })
})

describe('workers', () => {
  it('adds, views, edits and lists alphabetically', async () => {
    const ramesh = await addRamesh()
    unwrap(await s.workers.create({ name: 'Anita', workType: 'Weeding', dailyWage: 40000, phone: '9876543210' }))
    expect((await s.workers.get(ramesh.id))?.name).toBe('Ramesh')

    const edited = unwrap(await s.workers.update(ramesh.id, { name: ' Ramesh K ', workType: 'Tractor', dailyWage: 60000 }))
    expect(edited).toMatchObject({ name: 'Ramesh K', workType: 'Tractor', dailyWage: 60000 })
    expect((await s.workers.list()).map((w) => w.name)).toEqual(['Anita', 'Ramesh K'])
  })

  it('returns readable validation errors and saves nothing', async () => {
    const result = await s.workers.create({ name: '', workType: '', dailyWage: 0, phone: 'abc' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.error.fields ?? {}).sort()).toEqual(['dailyWage', 'name', 'phone', 'workType'])
    expect(await s.workers.list()).toEqual([])
  })

  it('deletes a worker with no records directly', async () => {
    const ramesh = await addRamesh()
    unwrap(await s.workers.remove(ramesh.id))
    expect(await s.workers.list()).toEqual([])
  })

  it('refuses to delete history without confirmation, then deletes it when confirmed', async () => {
    const ramesh = await addRamesh()
    unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 1000, date: '2026-10-01', type: 'advance' }))

    const blocked = await s.workers.remove(ramesh.id)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.error).toMatchObject({ code: 'has-records', related: { workRecords: 1, transactions: 1 } })
    expect(await s.workers.list()).toHaveLength(1)

    unwrap(await s.workers.remove(ramesh.id, { withRecords: true }))
    expect(await s.workers.list()).toEqual([])
    expect(await s.work.list()).toEqual([])
    expect(await s.transactions.list()).toEqual([])
  })
})

describe('work records', () => {
  it('calculates earnings for present, half day and absent', async () => {
    const ramesh = await addRamesh()
    const p = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    const h = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-02', status: 'half-day' }))
    const a = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-03', status: 'absent' }))
    expect([p.earnedAmount, h.earnedAmount, a.earnedAmount]).toEqual([50000, 25000, 0])
  })

  it('keeps historical earnings when the wage changes, including on later edits', async () => {
    const ramesh = await addRamesh()
    const old = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    unwrap(await s.workers.update(ramesh.id, { name: 'Ramesh', workType: 'Field work', dailyWage: 70000 }))

    expect((await s.work.get(old.id))?.earnedAmount).toBe(50000)
    const edited = unwrap(await s.work.update(old.id, { date: '2026-10-01', status: 'half-day' }))
    expect(edited.earnedAmount).toBe(25000)

    const fresh = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-02', status: 'present' }))
    expect(fresh.earnedAmount).toBe(70000)
  })

  it('prevents duplicate entries for the same worker and date, on create and on edit', async () => {
    const ramesh = await addRamesh()
    unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    const second = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-02', status: 'present' }))

    const dup = await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'absent' })
    expect(dup.ok ? null : dup.error.code).toBe('duplicate')

    const moved = await s.work.update(second.id, { date: '2026-10-01', status: 'present' })
    expect(moved.ok ? null : moved.error.code).toBe('duplicate')
  })

  it('rejects a missing worker and invalid date', async () => {
    const r = await s.work.create({ workerId: 'nobody', date: '2026-13-01', status: 'present' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe('validation')
  })

  it('lists newest first and deletes', async () => {
    const ramesh = await addRamesh()
    const first = unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-01', status: 'present' }))
    unwrap(await s.work.create({ workerId: ramesh.id, date: '2026-10-03', status: 'present' }))
    expect((await s.work.list()).map((r) => r.date)).toEqual(['2026-10-03', '2026-10-01'])
    unwrap(await s.work.remove(first.id))
    expect(await s.work.list()).toHaveLength(1)
  })
})

describe('transactions', () => {
  it('adds, edits and deletes advances and wage payments separately', async () => {
    const ramesh = await addRamesh()
    const adv = unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 100000, date: '2026-10-01', type: 'advance', note: ' festival ' }))
    const pay = unwrap(await s.transactions.create({ workerId: ramesh.id, amount: 20000, date: '2026-10-02', type: 'wage-payment' }))
    expect(adv.note).toBe('festival')

    unwrap(await s.transactions.update(adv.id, { ...adv, amount: 150000 }))
    unwrap(await s.transactions.update(pay.id, { ...pay, amount: 30000 }))
    const list = await s.transactions.list(ramesh.id)
    expect(list.map((t) => [t.type, t.amount])).toEqual([['wage-payment', 30000], ['advance', 150000]])

    unwrap(await s.transactions.remove(adv.id))
    unwrap(await s.transactions.remove(pay.id))
    expect(await s.transactions.list()).toEqual([])
  })

  it('rejects zero, fractional-paise and unknown-worker amounts', async () => {
    const ramesh = await addRamesh()
    for (const input of [
      { workerId: ramesh.id, amount: 0, date: '2026-10-01', type: 'advance' as const },
      { workerId: ramesh.id, amount: 10.5, date: '2026-10-01', type: 'advance' as const },
      { workerId: 'nobody', amount: 100, date: '2026-10-01', type: 'wage-payment' as const },
    ]) {
      expect((await s.transactions.create(input)).ok).toBe(false)
    }
  })
})
