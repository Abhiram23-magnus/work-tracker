import { useId, useState, type FormEvent } from 'react'
import type { Worker } from '../../types/worker'
import { WORK_STATUS_LABELS, type WorkRecord, type WorkStatus } from '../../types/work'
import type { ValidationErrors } from '../../domain/validation'
import { earnedAmountFor } from '../../domain/calculations'
import { workService } from '../../services'
import { formatPaise } from '../../utils/currency'
import { formatDisplayDate, todayISO } from '../../utils/dates'
import { Notice } from '../ui/Notice'
import { StatusPicker } from './StatusPicker'
import { workerOptionLabel } from '../../domain/workerLabel'

interface WorkEntryFormProps {
  /** Workers to choose from. Ignored when editing or when `worker` is fixed. */
  workers: Worker[]
  /** Fixes the worker, e.g. on their profile page. */
  worker?: Worker
  /** Edit this record instead of creating a new one. */
  record?: WorkRecord
  submitLabel?: string
  onSaved: (record: WorkRecord) => void
  onCancel: () => void
}

/** Select worker → date → Present / Half Day / Absent → optional note. Earnings are shown, never typed. */
export function WorkEntryForm({ workers, worker, record, submitLabel = 'Save work', onSaved, onCancel }: WorkEntryFormProps) {
  const id = useId()
  const [workerId, setWorkerId] = useState(record?.workerId ?? worker?.id ?? '')
  const [date, setDate] = useState(record?.date ?? todayISO())
  const [status, setStatus] = useState<WorkStatus | undefined>(record?.status)
  const [description, setDescription] = useState(record?.description ?? '')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formError, setFormError] = useState<string>()
  // Set when the chosen worker already has an entry on the chosen date.
  const [existing, setExisting] = useState<WorkRecord>()
  const [saving, setSaving] = useState(false)

  const selectedWorker = worker ?? workers.find((w) => w.id === workerId)
  const wage = record?.dailyWage ?? selectedWorker?.dailyWage
  const preview = status && wage !== undefined ? earnedAmountFor(status, wage) : undefined
  const fixedName = record ? (worker ?? workers.find((w) => w.id === record.workerId))?.name : worker?.name

  const clearExisting = () => setExisting(undefined)
  // Drop a field's error as soon as the farmer changes that field.
  const clearError = (field: string) => setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fields = { date, status: status as WorkStatus, description }
    const target = record ?? existing
    const result = target ? await workService.update(target.id, fields) : await workService.create({ workerId, ...fields })
    setSaving(false)

    if (result.ok) return onSaved(result.value)
    setErrors(result.error.fields ?? {})
    setFormError(undefined)
    if (result.error.code === 'duplicate' && !record) {
      const records = await workService.list(workerId)
      setExisting(records.find((r) => r.date === date))
    } else if (!result.error.fields) {
      setFormError(result.error.message)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
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
                clearExisting()
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
              clearExisting()
            }}
          />
        </div>
        {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
      </div>

      <StatusPicker
        value={status}
        onChange={(s) => {
          setStatus(s)
          clearError('status')
        }}
        error={errors.status}
      />

      <div className="field">
        <label htmlFor={`${id}-desc`}>Work done (optional)</label>
        <div className="field-control">
          <textarea
            id={`${id}-desc`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="For example: Cotton picking"
          />
        </div>
      </div>

      <div className="earn-preview" aria-live="polite">
        <span className="muted">Earns</span>
        <span className="money earn-amount">{preview === undefined ? '—' : formatPaise(preview)}</span>
      </div>

      {existing && (
        <Notice tone="info">
          {selectedWorker?.name} is already marked <strong>{WORK_STATUS_LABELS[existing.status]}</strong> on{' '}
          {formatDisplayDate(existing.date)}. Tap <strong>Update entry</strong> to replace it, or change the date.
        </Notice>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Update entry' : submitLabel}
        </button>
      </div>
    </form>
  )
}
