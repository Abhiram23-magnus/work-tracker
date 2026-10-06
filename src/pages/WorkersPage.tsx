import { useState } from 'react'
import { workerService } from '../services'
import { navigate } from '../app/routes'
import { useWorkers } from '../hooks/useWorkers'
import { WORK_STATUS_LABELS, type WorkRecord } from '../types/work'
import { formatPaise } from '../utils/currency'
import { WorkerForm } from '../components/worker/WorkerForm'
import { WorkerList } from '../components/worker/WorkerList'
import { WorkEntryForm } from '../components/work/WorkEntryForm'
import { Notice } from '../components/ui/Notice'

type Mode = 'list' | 'add-worker' | 'record-work'

export function WorkersPage() {
  const { workers, loading, reload } = useWorkers()
  const [mode, setMode] = useState<Mode>('list')
  const [lastSaved, setLastSaved] = useState<WorkRecord>()
  // Bumped after each save so the work form resets for the next worker.
  const [formKey, setFormKey] = useState(0)

  const savedName = lastSaved && workers.find((w) => w.id === lastSaved.workerId)?.name

  return (
    <section>
      <div className="page-head">
        <h1>Workers</h1>
        {mode === 'list' && workers.length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => setMode('add-worker')}>
            + Add worker
          </button>
        )}
      </div>

      {mode === 'add-worker' && (
        <WorkerForm
          submitLabel="Save worker"
          onSubmit={(input) => workerService.create(input)}
          onCancel={() => setMode('list')}
          onSaved={(worker) => {
            setMode('list')
            reload()
            navigate({ name: 'worker', id: worker.id })
          }}
        />
      )}

      {mode === 'record-work' && (
        <>
          {lastSaved && (
            <Notice tone="info">
              Saved: {savedName}, {WORK_STATUS_LABELS[lastSaved.status]}, {formatPaise(lastSaved.earnedAmount)}. Record the next worker or tap Done.
            </Notice>
          )}
          <WorkEntryForm
            key={formKey}
            workers={workers}
            onSaved={(record) => {
              setLastSaved(record)
              setFormKey((k) => k + 1)
            }}
            onCancel={() => {
              setMode('list')
              setLastSaved(undefined)
            }}
            submitLabel="Save work"
          />
          {lastSaved && (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => {
                setMode('list')
                setLastSaved(undefined)
              }}
            >
              Done
            </button>
          )}
        </>
      )}

      {mode === 'list' && !loading && workers.length === 0 && (
        <div className="card empty-state">
          <p className="empty-title">No workers yet</p>
          <p className="muted">Add the people who work on your farm to start tracking their days and wages.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setMode('add-worker')}>
            + Add your first worker
          </button>
        </div>
      )}

      {mode === 'list' && workers.length > 0 && (
        <>
          <button type="button" className="btn btn-primary btn-block btn-large" onClick={() => setMode('record-work')}>
            Record work
          </button>
          <WorkerList workers={workers} />
        </>
      )}
    </section>
  )
}
