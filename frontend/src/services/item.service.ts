// ============================================================
// ITEM SERVICE
// Backend routes: /items (admin only)
// ============================================================

import api from './api'
import type { Item, ItemLocation, WithdrawPayload, InboundResponse } from '../types'

export const itemService = {
  // GET /items - ดึงรายการ items ทั้งหมด (Admin)
  // Note: Backend ยังไม่มี GET /items แต่ใช้ /admin/items แทน
  getAll: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>('/admin/items')
    return data
  },

  // GET /admin/items/:id/locations - ดูสต็อกต่อ location
  getLocations: async (itemId: number): Promise<ItemLocation[]> => {
    const { data } = await api.get<ItemLocation[]>(`/admin/items/${itemId}/locations`)
    return data
  },

  // POST /items/withdraw - ถอนสต็อก (Admin only)
  withdraw: async (payload: WithdrawPayload): Promise<InboundResponse> => {
    const { data } = await api.post<InboundResponse>('/items/withdraw', payload)
    return data
  },
}
