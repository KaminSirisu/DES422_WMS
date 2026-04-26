import api from './api'
import type { CycleCountPayload, IssueReportPayload } from '../types'

export const staffService = {
  cycleCount: async (payload: CycleCountPayload): Promise<{
    message: string
    oldQuantity: number
    newQuantity: number
    delta: number
  }> => {
    const { data } = await api.post('/staff/cycle-count', payload)
    return data
  },

  reportIssue: async (payload: IssueReportPayload): Promise<{ message: string }> => {
    const { data } = await api.post('/staff/issues', payload)
    return data
  },
}
