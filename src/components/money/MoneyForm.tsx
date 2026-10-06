import { useId, useState, type FormEvent } from 'react'
import type { Worker } from '../../types/worker'
import { TRANSACTION_ACTION_LABELS, type Transaction, type TransactionType } from '../../types/transaction'
import type { ValidationErrors } from '../../domain/validation'
import { transactionService } from '../../services'
import { paiseToRupees, parseRupeeInput } from '../../utils/currency'
import { todayISO } from '../../utils/dates'
import { TextField } from '../ui/TextField'
import { Notice } from '../ui/Notice'
import { workerOptionLabel } from '../../domain/workerLabel'

interface MoneyFormProps {
  /** "advance" for Give Advance, "wage-payment" for Pay Wages. Fixed by the button the farmer tapped. */
  type: TransactionType
  workers: Worker[]
  /** Fixes the worker, e.g. on their profile page. */
  worker?: Worker
  /** Edit this transaction instead of creating one. */
  transaction?: Transaction
  onSaved: (transaction: Transaction) => void
  onCancel: () => void
}

const HINTS: Record<TransactionType, string> = {
  advance: 'Money given before the work is done. The worker works it off later.',
  'wage-payment': 'Money paid for work already done.',
}

export function MoneyForm({ type, workers, worker, transaction, onSaved, onCancel }: MoneyFormProps) {
  const id = useId()
  const [workerId, setWorkerId] = useState(transaction?.workerId ?? worker?.id ?? '')
  const [amount, setAmount] = useState(transaction ? String(paiseToRupees(transaction.amount)) : '')
  const [date, setDate] = useState(transaction?.date ?? todayISO())
  const [note, setNote] = useState(transaction?.note ?? '')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formError, setFormError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const kind = transaction?.type ?? type
  const fixedName = (worker ?? workers.find((w) => w.id === transaction?.workerId))?.name

  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const input = { workerId, amount: parseRupeeInput(amount), date, type: kind, note }
    const result = transaction
      ? await transactionService.update(transaction.id, input)
      : await transactionService.create(input)
    setSaving(false)
    if (result.ok) return onSaved(result.value)
    setErrors(result.error.fields ?? {})
    setFormError(result.error.fields ? undefined : result.error.message)
  }

  return (
    <form className={`card form money-form money-form-${kind}`} onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className="form-title">{TRANSACTION_ACTION_LABELS[kind]}</h2>
        <p className="muted small form-hint">{HINTS[kind]}</p>
      </div>
      {formError && <Notice>{formError}</Notice>}

      {fixedName ? (
        <p className="form-worker">{fixedName}</p>
      ) : (
        <div className={`field${errors.workerId ? ' field-invalid' : ''}`}>
          <label htmlFor={`${id}-worker`}>Worker</label>
          <div className="field-control">
            <select
              id={`${id}-worker`}
              value={workerId}
              onChange={(e) => {
                setWorkerId(e.target.value)
                clearError('workerId')
              }}
            >
              <option value="">Choose a worker</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {workerOptionLabel(w, workers)}
                </option>
              ))}
            </select>
          </div>
          {errors.workerId && <p className="field-error" role="alert">{errors.workerId}</p>}
        </div>
      )}

      <TextField
        label="Amount"
        prefix="₹"
        value={amount}
        onChange={(v) => {
          setAmount(v)
          clearError('amount')
        }}
        error={errors.amount}
        inputMode="decimal"
        autoComplete="off"
      />

      <div className={`field${errors.date ? ' field-invalid' : ''}`}>
        <label htmlFor={`${id}-date`}>Date</label>
        <div className="field-control">
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => {
              setDate(e.target.value)
              clearError('date')
            }}
          />
        </div>
        {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
      </div>

      <TextField label="Note (optional)" value={note} onChange={setNote} autoComplete="off" placeholder="For example: Festival advance" />

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : transaction ? 'Save changes' : TRANSACTION_ACTION_LABELS[kind]}
        </button>
      </div>
    </form>
  )
}
