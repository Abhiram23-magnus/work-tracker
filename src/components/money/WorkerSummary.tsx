import type { WorkerSummary as Summary } from '../../domain/calculations'
import { formatPaise } from '../../utils/currency'
import { AccountStatusBadge } from './AccountStatusBadge'

const formatDays = (days: number) => `${days} ${days === 1 ? 'day' : 'days'}`

/** Balance first and large, then the numbers behind it. A negative balance is shown as a negative amount. */
export function WorkerSummary({ name, summary }: { name: string; summary: Summary }) {
  const { balance, status } = summary
  const explanation =
    status === 'pending-to-pay'
      ? `You still owe ${name} ${formatPaise(balance)}.`
      : status === 'advance-to-recover'
        ? `${name} has received ${formatPaise(-balance)} more than earned and needs to work it off.`
        : `${name}'s account is settled.`

  return (
    <div className={`card summary summary-${status}`}>
      <div className="summary-balance">
        <span className="summary-label">Balance</span>
        <span className="money summary-amount" data-testid="balance">
          {formatPaise(balance)}
        </span>
        <AccountStatusBadge status={status} />
        <p className="summary-explain">{explanation}</p>
      </div>
      <dl className="summary-grid">
        <div>
          <dt>Days worked</dt>
          <dd>{formatDays(summary.daysWorked)}</dd>
        </div>
        <div>
          <dt>Total earnings</dt>
          <dd className="money">{formatPaise(summary.totalEarnings)}</dd>
        </div>
        <div>
          <dt>Advances</dt>
          <dd className="money">{formatPaise(summary.totalAdvances)}</dd>
        </div>
        <div>
          <dt>Wage payments</dt>
          <dd className="money">{formatPaise(summary.totalWagePayments)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total received</dt>
          <dd className="money">{formatPaise(summary.totalReceived)}</dd>
        </div>
      </dl>
    </div>
  )
}
