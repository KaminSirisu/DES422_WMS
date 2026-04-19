// ============================================================
// useApi HOOK - Generic data fetching
//
// ทำไมต้องมี hook นี้?
// → ทุก page ต้องมี loading, error, data state
// → แทนที่จะเขียนซ้ำทุก page ใช้ hook นี้แทน
//
// วิธีใช้:
//   const { data, isLoading, error, refetch } = useApi(() => adminService.getItems())
// ============================================================

import { useState, useEffect, useCallback } from 'react'

interface UseApiResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  // fn: async function ที่ return data
  fn: () => Promise<T>,
  // deps: dependencies array เหมือน useEffect
  // ถ้าไม่ใส่ → fetch ครั้งแรกอย่างเดียว
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)  // เพิ่มทุกครั้งที่ refetch

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      // ดึง message จาก API error response ถ้ามี
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(apiMsg || msg)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    setTrigger(t => t + 1)
  }, [])

  return { data, isLoading, error, refetch }
}
