import { Component, type ReactNode } from 'react'

/** Last line of defence: shows a calm message and a reload button instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-main">
        <div className="card empty-state">
          <p className="empty-title">Something went wrong on this screen</p>
          <p className="muted">Your saved records are safe. Reload the app to continue.</p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </main>
    )
  }
}
