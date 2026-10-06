import { useCallback } from 'react'
import type { Worker } from '../types/worker'
import { workerService } from '../services'
import { useLoad } from './useLoad'

export function useWorker(id: string) {
  const load = useCallback(() => workerService.get(id), [id])
  const { data, loading, reload } = useLoad<Worker | undefined>(load, undefined)
  return { worker: data, loading, reload }
}
