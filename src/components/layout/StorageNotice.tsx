import { useState } from 'react'
import { storageStatus } from '../../services'

/** Tells the farmer, once, if this phone can't save data or if damaged records were skipped. */
export function StorageNotice() {
  const [status] = useState(storageStatus)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || (status.persistent && status.recovered.length === 0)) return null

  return (
    <div className="notice notice-error storage-notice" role="alert">
      <p>
        {status.persistent
          ? 'Some saved records were damaged and could not be read, so they were skipped. A backup copy was kept on this phone.'
          : 'This browser is not allowing the app to save. Anything you enter will be lost when you close it. Turn off private browsing or allow site data.'}
      </p>
      <button type="button" className="btn btn-secondary btn-small" onClick={() => setDismissed(true)}>
        OK
      </button>
    </div>
  )
}
