import { useState } from 'react'
import type { Worker } from '../../types/worker'
import type { WorkRecord } from '../../types/work'
import type { Transaction } from '../../types/transaction'
import { exportExcel, exportSummaryPdf, exportWorkerPdf } from '../../services/exportService'
import { Notice } from '../ui/Notice'

interface Props {
  workers: Worker[]
  work: WorkRecord[]
  transactions: Transaction[]
  /** When set, the buttons export only this worker's statement. */
  worker?: Worker
}

/** Download buttons. The writers load on first tap, so the first export needs a connection only if the app was never opened online. */
export function ExportButtons({ workers, work, transactions, worker }: Props) {
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()

  const run = (name: string, job: () => Promise<void>) => async () => {
    setBusy(name)
    setError(undefined)
    try {
      await job()
    } catch {
      setError('Could not create the file. Please try again.')
    } finally {
      setBusy(undefined)
    }
  }
  const data = { workers, work, transactions }

  return (
    <div className="export-buttons">
      {error && <Notice>{error}</Notice>}
      <div className="form-actions">
        {worker ? (
          <button type="button" className="btn btn-secondary" disabled={Boolean(busy)} onClick={run('pdf', () => exportWorkerPdf(worker, data))}>
            {busy === 'pdf' ? 'Preparing…' : 'Statement (PDF)'}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" disabled={Boolean(busy) || workers.length === 0} onClick={run('xlsx', () => exportExcel(data))}>
              {busy === 'xlsx' ? 'Preparing…' : 'Export Excel'}
            </button>
            <button type="button" className="btn btn-secondary" disabled={Boolean(busy) || workers.length === 0} onClick={run('pdf', () => exportSummaryPdf(data))}>
              {busy === 'pdf' ? 'Preparing…' : 'Export PDF'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
