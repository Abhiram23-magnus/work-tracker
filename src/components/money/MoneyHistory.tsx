import { useState } from 'react'
import type { Worker } from '../../types/worker'
import { TRANSACTION_TYPE_LABELS, type Transaction } from '../../types/transaction'
import { transactionService } from '../../services'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate } from '../../utils/dates'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Notice } from '../ui/Notice'
import { MoneyForm } from './MoneyForm'

/** A worker's advances and wage payments, newest first, each with Edit and Delete. */
export function MoneyHistory({ worker, transactions, onChanged }: { worker: Worker; transactions: Transaction[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string>()
  const [deleting, setDeleting] = useState<Transaction>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const result = await transactionService.remove(deleting.id)
    setBusy(false)
    setDeleting(undefined)
    if (result.ok) onChanged()
    else setError(result.error.message)
  }

  if (transactions.length === 0) {
    return <p className="card muted empty-inline">No advances or payments yet.</p>
  }

  return (
    <>
      {error && <Notice>{error}</Notice>}
      <ul className="record-list">
        {transactions.map((t) =>
          t.id === editingId ? (
            <li key={t.id}>
              <MoneyForm
                type={t.type}
                workers={[worker]}
                worker={worker}
                transaction={t}
                onCancel={() => setEditingId(undefined)}
                onSaved={() => {
                  setEditingId(undefined)
                  onChanged()
                }}
              />
            </li>
          ) : (
            <li key={t.id} className="card record-row">
              <div className="record-main">
                <span className="record-date">{formatDisplayDate(t.date)}</span>
                <span className={`badge badge-${t.type}`}>{TRANSACTION_TYPE_LABELS[t.type]}</span>
                {t.note && <span className="muted record-note">{t.note}</span>}
              </div>
              <span className="money record-amount">{formatPaise(t.amount)}</span>
              <div className="record-actions">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => setEditingId(t.id)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger-outline btn-small" onClick={() => setDeleting(t)}>
                  Delete
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
      {deleting && (
        <ConfirmDialog
          title={`Delete this ${TRANSACTION_TYPE_LABELS[deleting.type].toLowerCase()}?`}
          message={`${worker.name}, ${formatDisplayDate(deleting.date)}: ${formatPaise(deleting.amount)}. This cannot be undone.`}
          confirmLabel="Delete entry"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(undefined)}
        />
      )}
    </>
  )
}
