// ============================================================
// ORDER SERVICE
// Backend routes:
//   POST /orders - สร้าง order ใหม่ (auth required)
//   GET  /orders/me - ดู order ของตัวเอง
//   GET  /orders/:id - ดู order detail
//   PUT  /orders/:id/cancel - ยกเลิก order
//   GET  /admin/orders - ดู orders ทั้งหมด (admin only)
// ============================================================

import api from './api'
import type { Order, CreateOrderPayload } from '../types'

export const orderService = {
  // GET /orders/me - ดู order ของตัวเอง
  getMyOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders/me')
    return data
  },

  // GET /orders/picking/pending - ดู orders ที่ต้อง pick
  getPendingPickingOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders/picking/pending')
    return data
  },

  // GET /orders/:id - ดู order detail
  getById: async (id: number): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  // PUT /orders/:id/status - อัพเดต order status
  updateStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await api.put<Order>(`/orders/${id}/status`, { status })
    return data
  },

  // PUT /orders/:id/cancel - ยกเลิก order
  cancel: async (id: number): Promise<{ message: string }> => {
    const { data } = await api.put(`/orders/${id}/cancel`, {})
    return data
  },

  // GET /admin/orders - ดู orders ทั้งหมด (admin only)
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
