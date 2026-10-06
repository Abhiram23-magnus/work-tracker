import type { Worker } from '../../types/worker'
import type { WorkerSummary } from '../../domain/calculations'
import { hrefFor } from '../../app/routes'
import { formatPaise } from '../../utils/currency'
import { AccountStatusBadge } from '../money/AccountStatusBadge'

export function WorkerList({ workers, summaries }: { workers: Worker[]; summaries: Map<string, WorkerSummary> }) {
  return (
    <ul className="worker-list">
      {workers.map((worker) => {
        const summary = summaries.get(worker.id)
        return (
          <li key={worker.id}>
            <a className="card worker-row" href={hrefFor({ name: 'worker', id: worker.id })}>
              <span className="worker-row-main">
                <span className="worker-name">{worker.name}</span>
                <span className="muted small">
                  {worker.workType} · {formatPaise(worker.dailyWage)}/day
                </span>
              </span>
              {summary && (
                <span className="worker-balance">
                  <span className="money">{formatPaise(summary.balance)}</span>
                  <AccountStatusBadge status={summary.status} />
                </span>
              )}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
