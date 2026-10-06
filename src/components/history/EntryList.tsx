import { useState } from 'react'
import type { Worker } from '../../types/worker'
import type { HistoryEntry } from '../../domain/history'
import { Notice } from '../ui/Notice'
import { HistoryEntryItem } from './HistoryEntryItem'

interface EntryListProps {
  entries: HistoryEntry[]
  workers: Worker[]
  emptyText: string
  showWorker?: boolean
  showDate?: boolean
  onChanged: () => void
}

export function EntryList({ entries, workers, emptyText, showWorker, showDate, onChanged }: EntryListProps) {
  const [error, setError] = useState<string>()
  if (entries.length === 0) return <p className="card muted empty-inline">{emptyText}</p>
  return (
    <>
      {error && <Notice>{error}</Notice>}
      <ul className="record-list">
        {entries.map((entry) => (
          <HistoryEntryItem
            key={entry.id}
            entry={entry}
            worker={workers.find((w) => w.id === entry.workerId)}
            showWorker={showWorker}
            showDate={showDate}
            onChanged={onChanged}
            onError={setError}
          />
        ))}
      </ul>
    </>
  )
}
