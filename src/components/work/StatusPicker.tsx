import { WORK_STATUSES, WORK_STATUS_LABELS, type WorkStatus } from '../../types/work'

/** Three large tap targets instead of a dropdown. Built on real radio inputs for keyboard and screen readers. */
export function StatusPicker({ value, onChange, error }: { value?: WorkStatus; onChange: (s: WorkStatus) => void; error?: string }) {
  return (
    <fieldset className={`field status-picker${error ? ' field-invalid' : ''}`}>
      <legend>Attendance</legend>
      <div className="status-options">
        {WORK_STATUSES.map((status) => (
          <label key={status} className={`status-option status-${status}`}>
            <input
              type="radio"
              name="work-status"
              value={status}
              checked={value === status}
              onChange={() => onChange(status)}
            />
            <span>{WORK_STATUS_LABELS[status]}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
