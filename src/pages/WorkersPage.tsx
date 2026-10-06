import { useState } from 'react'
import { workerService } from '../services'
import { navigate } from '../app/routes'
import { useWorkers } from '../components/worker/useWorkers'
import { WorkerForm } from '../components/worker/WorkerForm'
import { WorkerList } from '../components/worker/WorkerList'

export function WorkersPage() {
  const { workers, loading, reload } = useWorkers()
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="page-head">
        <h1>Workers</h1>
        {!adding && workers.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            + Add worker
          </button>
        )}
      </div>

      {adding && (
        <WorkerForm
          submitLabel="Save worker"
          onSubmit={(input) => workerService.create(input)}
          onCancel={() => setAdding(false)}
          onSaved={(worker) => {
            setAdding(false)
            reload()
            navigate({ name: 'worker', id: worker.id })
          }}
        />
      )}

      {!loading && workers.length === 0 && !adding && (
        <div className="card empty-state">
          <p className="empty-title">No workers yet</p>
          <p className="muted">Add the people who work on your farm to start tracking their days and wages.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
            + Add your first worker
          </button>
        </div>
      )}

      {!adding && <WorkerList workers={workers} />}
    </section>
  )
}
