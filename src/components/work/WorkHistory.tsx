import { useState } from 'react'
import type { Worker } from '../../types/worker'
import { WORK_STATUS_LABELS, type WorkRecord } from '../../types/work'
import { workService } from '../../services'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/dates'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Notice } from '../ui/Notice'
import { WorkEntryForm } from './WorkEntryForm'

/** A worker's work entries, newest first, each with Edit and Delete. */
export function WorkHistory({ worker, records, onChanged }: { worker: Worker; records: WorkRecord[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string>()
  const [deleting, setDeleting] = useState<WorkRecord>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const result = await workService.remove(deleting.id)
    setBusy(false)
    setDeleting(undefined)
    if (result.ok) onChanged()
    else setError(result.error.message)
  }

  if (records.length === 0) {
    return <p className="card muted empty-inline">No work recorded yet.</p>
  }

  return (
    <>
      {error && <Notice>{error}</Notice>}
      <ul className="record-list">
        {records.map((record) =>
          record.id === editingId ? (
            <li key={record.id}>
              <WorkEntryForm
                workers={[worker]}
                worker={worker}
                record={record}
                submitLabel="Save changes"
                onCancel={() => setEditingId(undefined)}
                onSaved={() => {
                  setEditingId(undefined)
                  onChanged()
                }}
              />
            </li>
          ) : (
            <li key={record.id} className="card record-row">
              <div className="record-main">
                <span className="record-date">{formatDisplayDate(record.date)}</span>
                <span className={`badge badge-${record.status}`}>{WORK_STATUS_LABELS[record.status]}</span>
                {record.description && <span className="muted record-note">{record.description}</span>}
              </div>
              <span className="money record-amount">{formatPaise(record.earnedAmount)}</span>
              <div className="record-actions">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingId(record.id)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger-outline btn-small" onClick={() => setDeleting(record)}>
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {deleting && (
        <ConfirmDialog
          title="Delete this work entry?"
          message={`${worker.name}, ${formatDisplayDate(deleting.date)}: ${WORK_STATUS_LABELS[deleting.status]}, ${formatPaise(deleting.earnedAmount)}. This cannot be undone.`}
          confirmLabel="Delete entry"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </>
  )
}
