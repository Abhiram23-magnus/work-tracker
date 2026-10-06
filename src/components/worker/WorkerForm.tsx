import { useState, type FormEvent } from 'react'
import type { Worker, WorkerInput } from '../../types/worker'
import type { ValidationErrors } from '../../domain/validation'
import type { Result } from '../../services/result'
import { paiseToRupees, rupeesToPaise } from '../../utils/currency'
import { TextField } from '../ui/TextField'
import { Notice } from '../ui/Notice'

interface WorkerFormProps {
  initial?: Worker
  submitLabel: string
  onSubmit: (input: WorkerInput) => Promise<Result<Worker>>
  onCancel: () => void
  onSaved: (worker: Worker) => void
}

export function WorkerForm({ initial, submitLabel, onSubmit, onCancel, onSaved }: WorkerFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [workType, setWorkType] = useState(initial?.workType ?? '')
  const [wage, setWage] = useState(initial ? String(paiseToRupees(initial.dailyWage)) : '')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formError, setFormError] = useState<string>()
  const [saving, setSaving] = useState(false)

  // Drop a field's error as soon as the farmer changes that field.
  const edit = (field: string, set: (v: string) => void) => (value: string) => {
    set(value)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await onSubmit({ name, phone, workType, dailyWage: rupeesToPaise(wage) })
    setSaving(false)
    if (result.ok) return onSaved(result.value)
    setErrors(result.error.fields ?? {})
    setFormError(result.error.fields ? undefined : result.error.message)
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {formError && <Notice>{formError}</Notice>}
      <TextField label="Name" value={name} onChange={edit('name', setName)} error={errors.name} autoComplete="off" autoFocus />
      <TextField
        label="Work type"
        value={workType}
        onChange={edit('workType', setWorkType)}
        error={errors.workType}
        hint="For example: Harvesting, Weeding, Tractor"
        autoComplete="off"
      />
      <TextField
        label="Daily wage"
        prefix="₹"
        value={wage}
        onChange={edit('dailyWage', setWage)}
        error={errors.dailyWage}
        inputMode="decimal"
        autoComplete="off"
      />
      <TextField
        label="Phone (optional)"
        value={phone}
        onChange={edit('phone', setPhone)}
        error={errors.phone}
        type="tel"
        inputMode="tel"
        autoComplete="off"
      />
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
