import { useCallback, useEffect, useState } from 'react'
import type { Worker } from '../../types/worker'
import { workerService } from '../../services'

/** Runs an async loader on mount and whenever reload() is called; ignores results after unmount. */
function useLoad<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    load().then((value) => {
      if (!active) return
      setData(value)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [load, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, loading, reload }
}

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
