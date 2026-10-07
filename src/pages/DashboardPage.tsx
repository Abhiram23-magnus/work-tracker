import { useMemo, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { dashboardTotals } from '../domain/calculations'
import { hrefFor } from '../app/routes'
import { formatPaise } from '../utils/currency'
import { formatDisplayDate, todayISO } from '../utils/dates'
import type { TransactionType } from '../types/transaction'
import { WorkEntryForm } from '../components/work/WorkEntryForm'
import { MoneyForm } from '../components/money/MoneyForm'
import { Notice } from '../components/ui/Notice'
import { Insights } from '../components/dashboard/Insights'
import { ExportButtons } from '../components/export/ExportButtons'
import { AccountCard } from '../components/account/AccountCard'

type Action = 'work' | TransactionType

export function DashboardPage() {
  const { workers, work, transactions, loading, reload } = useAppData()
  const [action, setAction] = useState<Action>()
  const [saved, setSaved] = useState<string>()
  const today = todayISO()
  const totals = useMemo(() => dashboardTotals(workers, work, transactions, today), [workers, work, transactions, today])

  const finish = (message: string) => {
    setAction(undefined)
    setSaved(message)
    reload()
  }

  if (loading) return null

  if (workers.length === 0) {
    return (
      <section>
        <h1>Today</h1>
        <div className="card empty-state">
          <p className="empty-title">Welcome to your farm notebook</p>
          <p className="muted">Start by adding the people who work on your farm.</p>
          <a className="btn btn-primary btn-block" href={hrefFor({ name: 'workers' })}>
            + Add your first worker
          </a>
        </div>
        <AccountCard />
      </section>
    )
  }

  return (
    <section>
      <h1>Today</h1>
      <p className="muted page-sub">{formatDisplayDate(today)}</p>
      {saved && <Notice tone="info">{saved}</Notice>}

      <div className="stat-grid">
        <Stat label="Pending to pay" value={formatPaise(totals.totalPendingToPay)} tone="pending" big hint="You owe workers" />
        <Stat label="Advances to recover" value={formatPaise(totals.totalAdvancesToRecover)} tone="recover" big hint="Workers owe work" />
        <Stat label="Today’s earnings" value={formatPaise(totals.todaysEarnings)} />
        <Stat label="Today’s payments" value={formatPaise(totals.todaysPayments)} hint="Wages only" />
        <Stat label="Worked today" value={String(totals.todaysWorkers)} />
        <Stat label="Total workers" value={String(totals.totalWorkers)} />
      </div>

      <h2 className="section-head">Quick actions</h2>
      {action === 'work' && (
        <WorkEntryForm workers={workers} onCancel={() => setAction(undefined)} onSaved={() => finish('Work saved.')} />
      )}
      {(action === 'advance' || action === 'wage-payment') && (
        <MoneyForm
          type={action}
          workers={workers}
          onCancel={() => setAction(undefined)}
          onSaved={() => finish(action === 'advance' ? 'Advance saved.' : 'Wage payment saved.')}
        />
      )}
      {!action && (
        <div className="quick-actions">
          <button type="button" className="btn btn-primary btn-large" onClick={() => { setSaved(undefined); setAction('work') }}>
            Record work
          </button>
          <div className="form-actions">
            <button type="button" className="btn btn-advance btn-large" onClick={() => { setSaved(undefined); setAction('advance') }}>
              Give Advance
            </button>
            <button type="button" className="btn btn-primary btn-large" onClick={() => { setSaved(undefined); setAction('wage-payment') }}>
              Pay Wages
            </button>
          </div>
        </div>
      )}

      <Insights workers={workers} work={work} transactions={transactions} today={today} />

      <h2 className="section-head">Export data</h2>
      <ExportButtons workers={workers} work={work} transactions={transactions} />

      <AccountCard />
    </section>
  )
}

function Stat({ label, value, hint, tone, big }: { label: string; value: string; hint?: string; tone?: 'pending' | 'recover'; big?: boolean }) {
  return (
    <div className={`card stat${big ? ' stat-big' : ''}${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="money stat-value">{value}</span>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  )
}
