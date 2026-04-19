// ============================================================
// LOG SERVICE
// Backend route: GET /logs (admin only)
// Supports query params: ?action=ADD&startDate=...&endDate=...
// ============================================================

import api from './api'
import type { Log, LogAction } from '../types'

export interface LogFilters {
  action?: LogAction
  startDate?: string  // ISO string
  endDate?: string    // ISO string
}

export const logService = {
  // GET /logs?action=ADD&startDate=...&endDate=...
  getAll: async (filters?: LogFilters): Promise<Log[]> => {
    const { data } = await api.get<Log[]>('/logs', {
      params: filters,
    })
    return data
  },
}
