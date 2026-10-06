import { useState } from 'react'
import type { Worker } from '../../types/worker'
import { workerService } from '../../services'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface Pending {
  workRecords: number
  transactions: number
}

/** Delete button with a confirmation that spells out any work and money history that will go too. */
export function DeleteWorker({ worker, onDeleted, onError }: { worker: Worker; onDeleted: () => void; onError: (message: string) => void }) {
  const [pending, setPending] = useState<Pending>()
  const [busy, setBusy] = useState(false)

  const hasRecords = pending ? pending.workRecords + pending.transactions > 0 : false

  async function confirm() {
    setBusy(true)
    const result = await workerService.remove(worker.id, { withRecords: hasRecords })
    setBusy(false)
    setPending(undefined)
    if (result.ok) onDeleted()
    else onError(result.error.message)
  }

  const message = hasRecords
    ? `${worker.name} has ${historyText(pending!)}. Deleting will permanently remove all of it. This cannot be undone.`
    : `${worker.name} will be removed. This cannot be undone.`

  return (
    <>
      <button
        type="button"
        className="btn btn-danger-outline"
        onClick={async () => setPending(await workerService.relatedCounts(worker.id))}
      >
        Delete worker
      </button>
      {pending && (
        <ConfirmDialog
          title={`Delete ${worker.name}?`}
          message={message}
          confirmLabel={hasRecords ? 'Delete worker and records' : 'Delete worker'}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(undefined)}
        />
      )}
    </>
  )
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const historyText = ({ workRecords, transactions }: Pending) =>
  [
    workRecords > 0 && plural(workRecords, 'work entry', 'work entries'),
    transactions > 0 && plural(transactions, 'money entry', 'money entries'),
  ]
    .filter(Boolean)
    .join(' and ')
