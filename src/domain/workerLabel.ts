import type { Worker } from '../types/worker'

const key = (name: string) => name.trim().toLowerCase()

/** Dropdown label for a worker; adds work type and phone when another worker shares the name, so the right person is picked. */
export function workerOptionLabel(worker: Worker, all: Worker[]): string {
  const twins = all.filter((w) => key(w.name) === key(worker.name))
  if (twins.length < 2) return worker.name
  const extra = [worker.workType, worker.phone].filter(Boolean).join(', ')
  return extra ? `${worker.name} (${extra})` : worker.name
}
