import { useCallback } from 'react'
import type { WorkRecord } from '../types/work'
import { workService } from '../services'
import { useLoad } from './useLoad'

/** One worker's work history, newest first. */
export function useWorkRecords(workerId: string) {
  const load = useCallback(() => workService.list(workerId), [workerId])
  const { data, loading, reload } = useLoad<WorkRecord[]>(load, [])
  return { records: data, loading, reload }
}
