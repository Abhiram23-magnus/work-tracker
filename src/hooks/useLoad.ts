import { useCallback, useEffect, useState } from 'react'

/** Runs an async loader on mount and whenever reload() is called; ignores results after unmount. */
export function useLoad<T>(load: () => Promise<T>, initial: T) {
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
