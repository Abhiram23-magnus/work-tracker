import { useCallback } from 'react'
import type { Worker } from '../types/worker'
import { workerService } from '../services'
import { useLoad } from './useLoad'

const listWorkers = () => workerService.list()

export function useWorkers() {
  const { data, loading, reload } = useLoad(listWorkers, [] as Worker[])
  return { workers: data, loading, reload }
}

export function useWorker(id: string) {
  const load = useCallback(() => workerService.get(id), [id])
  const { data, loading, reload } = useLoad<Worker | undefined>(load, undefined)
  return { worker: data, loading, reload }
}
