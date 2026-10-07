import { useMemo } from 'react'
import type { Worker } from '../../types/worker'
import type { WorkRecord } from '../../types/work'
import type { Transaction } from '../../types/transaction'
import { monthlySeries, shortMonthLabel, topOwed } from '../../domain/insights'
import { formatPaise } from '../../utils/currency'
import { hrefFor } from '../../app/routes'

interface Props {
  workers: Worker[]
  work: WorkRecord[]
  transactions: Transaction[]
  today: string
}

/** Last six months of earnings vs wages paid, and who is owed most. */
export function Insights({ workers, work, transactions, today }: Props) {
  const series = useMemo(() => monthlySeries(work, transactions, today), [work, transactions, today])
  const owed = useMemo(() => topOwed(workers, work, transactions), [workers, work, transactions])
  const max = Math.max(1, ...series.flatMap((p) => [p.earned, p.paid]))

  return (
    <>
      <h2 className="section-head">Last 6 months</h2>
      <div className="card">
        <div className="bar-chart" role="img" aria-label="Earned and paid per month">
          {series.map((p) => (
            <div key={p.month} className="bar-col">
              <div className="bar-pair">
                <span className="bar bar-earned" style={{ height: `${(p.earned / max) * 100}%` }} title={`Earned ${formatPaise(p.earned)}`} />
                <span className="bar bar-paid" style={{ height: `${(p.paid / max) * 100}%` }} title={`Paid ${formatPaise(p.paid)}`} />
              </div>
              <span className="bar-label">{shortMonthLabel(p.month)}</span>
            </div>
          ))}
        </div>
        <p className="muted small bar-legend">
          <span className="swatch bar-earned" /> Earned <span className="swatch bar-paid" /> Wages paid
        </p>
        <table className="mini-table">
          <thead>
            <tr><th>Month</th><th>Earned</th><th>Paid</th></tr>
          </thead>
          <tbody>
            {[...series].reverse().map((p) => (
              <tr key={p.month}>
                <td>{shortMonthLabel(p.month)}</td>
                <td className="money">{formatPaise(p.earned)}</td>
                <td className="money">{formatPaise(p.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {owed.length > 0 && (
        <>
          <h2 className="section-head">Most pending to pay</h2>
          <div className="card">
            <ol className="owed-list">
              {owed.map((row) => (
                <li key={row.worker.id}>
                  <a href={hrefFor({ name: 'worker', id: row.worker.id })}>{row.worker.name}</a>
                  <span className="money">{formatPaise(row.balance)}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </>
  )
}
