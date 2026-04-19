// ============================================================
// INBOUND SERVICE
// Backend routes: POST /inbound (Admin only)
// ============================================================

import api from './api'
import type { InboundPayload, InboundResponse } from '../types'

export const inboundService = {
  // POST /inbound - เพิ่มสต็อกเข้า warehouse
  addStock: async (payload: InboundPayload): Promise<InboundResponse> => {
    const { data } = await api.post<InboundResponse>('/inbound', payload)
    return data
  },
}
