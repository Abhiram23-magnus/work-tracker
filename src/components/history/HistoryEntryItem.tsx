import { useState } from 'react'
import type { Worker } from '../../types/worker'
import { WORK_STATUS_LABELS } from '../../types/work'
import { TRANSACTION_TYPE_LABELS } from '../../types/transaction'
import type { HistoryEntry } from '../../domain/history'
import { transactionService, workService } from '../../services'
import { hrefFor } from '../../app/routes'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/dates'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { WorkEntryForm } from '../work/WorkEntryForm'
import { MoneyForm } from '../money/MoneyForm'

interface HistoryEntryItemProps {
  entry: HistoryEntry
  worker?: Worker
  /** Show the worker's name (History page) or not (worker profile). */
  showWorker?: boolean
  /** Show the date (worker profile) or not (History page groups by date). */
  showDate?: boolean
  onChanged: () => void
  onError: (message: string) => void
}

/** One work or money entry with inline Edit and confirmed Delete. */
export function HistoryEntryItem({ entry, worker, showWorker, showDate = true, onChanged, onError }: HistoryEntryItemProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const name = worker?.name ?? 'Deleted worker'
  const isWork = entry.kind === 'work'
  const label = isWork ? WORK_STATUS_LABELS[entry.record.status] : TRANSACTION_TYPE_LABELS[entry.record.type]
  const badgeClass = isWork ? entry.record.status : entry.record.type
  const note = isWork ? entry.record.description : entry.record.note
  const amount = isWork ? entry.record.earnedAmount : entry.record.amount

  async function confirmDelete() {
    setBusy(true)
    const result = isWork ? await workService.remove(entry.id) : await transactionService.remove(entry.id)
    setBusy(false)
    setDeleting(false)
    if (result.ok) onChanged()
    else onError(result.error.message)
  }

  const done = () => {
    setEditing(false)
    onChanged()
  }

  if (editing && worker) {
    return (
      <li>
        {entry.kind === 'work' ? (
          <WorkEntryForm workers={[worker]} worker={worker} record={entry.record} submitLabel="Save changes" onCancel={() => setEditing(false)} onSaved={done} />
        ) : (
          <MoneyForm type={entry.record.type} workers={[worker]} worker={worker} transaction={entry.record} onCancel={() => setEditing(false)} onSaved={done} />
        )}
      </li>
    )
  }

  return (
    <li className={`card record-row record-${entry.kind}`}>
      <div className="record-main">
        {showWorker &&
          (worker ? (
            <a className="record-worker" href={hrefFor({ name: 'worker', id: worker.id })}>
              {name}
            </a>
          ) : (
            <span className="record-worker">{name}</span>
          ))}
        {showDate && <span className="record-date">{formatDisplayDate(entry.date)}</span>}
        <span className={`badge badge-${badgeClass}`}>{label}</span>
        {note && <span className="muted record-note">{note}</span>}
      </div>
      <span className="money record-amount">{formatPaise(amount)}</span>
      <div className="record-actions">
        <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditing(true)} disabled={!worker}>
          Edit
        </button>
        <button type="button" className="btn btn-danger-outline btn-small" onClick={() => setDeleting(true)}>
          Delete
        </button>
      </div>
      {deleting && (
        <ConfirmDialog
          title={`Delete this ${isWork ? 'work entry' : label.toLowerCase()}?`}
          message={`${name}, ${formatDisplayDate(entry.date)}: ${label}, ${formatPaise(amount)}. This cannot be undone.`}
          confirmLabel="Delete entry"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(false)}
        />
      )}
    </li>
  )
}
