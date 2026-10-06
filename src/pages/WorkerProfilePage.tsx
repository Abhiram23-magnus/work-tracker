import { useState } from 'react'
import { workerService } from '../services'
import { hrefFor, navigate } from '../app/routes'
import { formatPaise } from '../utils/currency'
import { useWorker } from '../hooks/useWorkers'
import { useWorkRecords } from '../hooks/useWorkRecords'
import { WorkEntryForm } from '../components/work/WorkEntryForm'
import { WorkHistory } from '../components/work/WorkHistory'
import { useTransactions } from '../hooks/useTransactions'
import { MoneyForm } from '../components/money/MoneyForm'
import { MoneyHistory } from '../components/money/MoneyHistory'
import type { TransactionType } from '../types/transaction'
import { summarizeWorker } from '../domain/calculations'
import { WorkerSummary } from '../components/money/WorkerSummary'
import { WorkerForm } from '../components/worker/WorkerForm'
import { DeleteWorker } from '../components/worker/DeleteWorker'
import { Notice } from '../components/ui/Notice'

export function WorkerProfilePage({ id }: { id: string }) {
  const { worker, loading, reload } = useWorker(id)
  const { records, reload: reloadWork } = useWorkRecords(id)
  const [editing, setEditing] = useState(false)
  const [recording, setRecording] = useState(false)
  const { transactions, reload: reloadMoney } = useTransactions(id)
  const [paying, setPaying] = useState<TransactionType>()
  const [error, setError] = useState<string>()

  if (loading) return null

  if (!worker) {
    return (
      <section className="card empty-state">
        <p className="empty-title">Worker not found</p>
        <p className="muted">This worker may have been deleted.</p>
        <a className="btn btn-secondary btn-block" href={hrefFor({ name: 'workers' })}>
          Back to workers
        </a>
      </section>
    )
  }

  return (
    <section>
      <a className="back-link" href={hrefFor({ name: 'workers' })}>
        ← Workers
      </a>
      <h1>{worker.name}</h1>
      {error && <Notice>{error}</Notice>}
      <WorkerSummary name={worker.name} summary={summarizeWorker(records, transactions)} />

      {editing ? (
        <WorkerForm
          initial={worker}
          submitLabel="Save changes"
          onSubmit={(input) => workerService.update(worker.id, input)}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            reload()
          }}
        />
      ) : (
        <>
          <dl className="card details">
            <div>
              <dt>Work type</dt>
              <dd>{worker.workType}</dd>
            </div>
            <div>
              <dt>Daily wage</dt>
              <dd className="money">{formatPaise(worker.dailyWage)}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{worker.phone ? <a href={`tel:${worker.phone}`}>{worker.phone}</a> : <span className="muted">Not added</span>}</dd>
            </div>
          </dl>
          <p className="muted small">Changing the daily wage only affects new work entries.</p>
          <div className="form-actions">
            <DeleteWorker worker={worker} onDeleted={() => navigate({ name: 'workers' })} onError={setError} />
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              Edit worker
            </button>
          </div>
        </>
      )}

      <div className="section-head">
        <h2>Work history</h2>
      </div>
      {recording ? (
        <WorkEntryForm
          workers={[worker]}
          worker={worker}
          onCancel={() => setRecording(false)}
          onSaved={() => {
            setRecording(false)
            reloadWork()
          }}
        />
      ) : (
        <button type="button" className="btn btn-primary btn-block btn-large" onClick={() => setRecording(true)}>
          Record work
        </button>
      )}
      <WorkHistory worker={worker} records={records} onChanged={reloadWork} />

      <div className="section-head">
        <h2>Money history</h2>
      </div>
      {paying ? (
        <MoneyForm
          type={paying}
          workers={[worker]}
          worker={worker}
          onCancel={() => setPaying(undefined)}
          onSaved={() => {
            setPaying(undefined)
            reloadMoney()
          }}
        />
      ) : (
        <div className="form-actions money-actions">
          <button type="button" className="btn btn-advance btn-large" onClick={() => setPaying('advance')}>
            Give Advance
          </button>
          <button type="button" className="btn btn-primary btn-large" onClick={() => setPaying('wage-payment')}>
            Pay Wages
          </button>
        </div>
      )}
      <MoneyHistory worker={worker} transactions={transactions} onChanged={reloadMoney} />
    </section>
  )
}
