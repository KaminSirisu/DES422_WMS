// ============================================================
// ORDER SERVICE
// Backend routes:
//   POST /orders - สร้าง order ใหม่ (auth required)
//   GET  /admin/orders - ดู orders ทั้งหมด (admin only)
// ============================================================

import api from './api'
import type { Order, CreateOrderPayload } from '../types'

export const orderService = {
  // GET /admin/orders - ดู orders ทั้งหมด
  getAll: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/admin/orders')
    return data
  },

  // POST /orders - สร้าง order
  // payload = { items: [{ itemId, quantity }] }
  create: async (payload: CreateOrderPayload): Promise<{ message: string; order: Order }> => {
    const { data } = await api.post('/orders', payload)
    return data
  },
}
