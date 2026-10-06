import { useId, useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { buildHistory, groupByDate, type HistoryFilters } from '../domain/history'
import { ACCOUNT_STATUS_LABELS, type AccountStatus } from '../domain/accountStatus'
import { formatDisplayDate } from '../utils/dates'
import { EntryList } from '../components/history/EntryList'

const STATUSES = Object.keys(ACCOUNT_STATUS_LABELS) as AccountStatus[]

export function HistoryPage() {
  const id = useId()
  const { workers, work, transactions, loading, reload } = useAppData()
  const [filters, setFilters] = useState<HistoryFilters>({})
  const groups = useMemo(
    () => groupByDate(buildHistory(workers, work, transactions, filters)),
    [workers, work, transactions, filters],
  )
  const filtered = Boolean(filters.workerId || filters.date || filters.status)
  const set = (patch: HistoryFilters) => setFilters((f) => ({ ...f, ...patch }))

  return (
    <section>
      <h1>History</h1>
      <div className="card filters">
        <div className="field">
          <label htmlFor={`${id}-w`}>Worker</label>
          <div className="field-control">
            <select id={`${id}-w`} value={filters.workerId ?? ''} onChange={(e) => set({ workerId: e.target.value || undefined })}>
              <option value="">All workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters-row">
          <div className="field">
            <label htmlFor={`${id}-d`}>Date</label>
            <div className="field-control">
              <input id={`${id}-d`} type="date" value={filters.date ?? ''} onChange={(e) => set({ date: e.target.value || undefined })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`${id}-s`}>Account</label>
            <div className="field-control">
              <select
                id={`${id}-s`}
                value={filters.status ?? ''}
                onChange={(e) => set({ status: (e.target.value || undefined) as AccountStatus | undefined })}
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ACCOUNT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {filtered && (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setFilters({})}>
            Clear filters
          </button>
        )}
      </div>

      {!loading && groups.length === 0 && (
        <p className="card muted empty-inline">
          {filtered ? 'Nothing matches these filters.' : 'No work or payments recorded yet.'}
        </p>
      )}

      {groups.map((group) => (
        <div key={group.date} className="history-group">
          <h2 className="history-date">{formatDisplayDate(group.date)}</h2>
          <EntryList entries={group.entries} workers={workers} emptyText="" showWorker showDate={false} onChanged={reload} />
        </div>
      ))}
    </section>
  )
}
