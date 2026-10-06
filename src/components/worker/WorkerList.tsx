import type { Worker } from '../../types/worker'
import { hrefFor } from '../../app/routes'
import { formatPaise } from '../../utils/currency'

export function WorkerList({ workers }: { workers: Worker[] }) {
  return (
    <ul className="worker-list">
      {workers.map((worker) => (
        <li key={worker.id}>
          <a className="card worker-row" href={hrefFor({ name: 'worker', id: worker.id })}>
            <span className="worker-row-main">
              <span className="worker-name">{worker.name}</span>
              <span className="muted">{worker.workType}</span>
            </span>
            <span className="worker-wage">
              {formatPaise(worker.dailyWage)}
              <span className="muted"> /day</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
