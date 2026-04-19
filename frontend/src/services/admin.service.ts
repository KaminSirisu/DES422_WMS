// ============================================================
// ADMIN SERVICE
// Backend routes under /admin (admin middleware required)
// ใช้สำหรับ CRUD items, locations, users, orders
// ============================================================

import api from './api'
import type { Item, Location, Order, User } from '../types'

// ── ITEMS ─────────────────────────────────────────────────
export interface CreateItemPayload {
  name: string
  minStock: number
}

export interface UpdateItemPayload {
  name?: string
  minStock?: number
}

// ── LOCATIONS ─────────────────────────────────────────────
export interface CreateLocationPayload {
  name: string
  capacity?: number
}

export const adminService = {
  // ── ITEMS ──────────────────────────────────────────────
  // GET /admin/items
  getItems: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>('/admin/items')
    return data
  },

  // POST /admin/items
  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    const { data } = await api.post<Item>('/admin/items', payload)
    return data
  },

  // PUT /admin/items/:id
  updateItem: async (id: number, payload: UpdateItemPayload): Promise<Item> => {
    const { data } = await api.put<Item>(`/admin/items/${id}`, payload)
    return data
  },

  // DELETE /admin/items/:id
  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/admin/items/${id}`)
  },

  // ── LOCATIONS ──────────────────────────────────────────
  // GET /admin/locations
  getLocations: async (): Promise<Location[]> => {
    const { data } = await api.get<Location[]>('/admin/locations')
    return data
  },

  // POST /admin/locations
  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    const { data } = await api.post<Location>('/admin/locations', payload)
    return data
  },

  // DELETE /admin/locations/:id
  deleteLocation: async (id: number): Promise<void> => {
    await api.delete(`/admin/locations/${id}`)
  },

  // ── ORDERS ────────────────────────────────────────────
  // GET /admin/orders
  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/admin/orders')
    return data
  },

  // PUT /admin/orders/:id/status
  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await api.put<Order>(`/admin/orders/${id}/status`, { status })
    return data
  },

  // ── USERS ──────────────────────────────────────────────
  // GET /admin/users
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/admin/users')
    return data
  },

  // ── DASHBOARD STATS ────────────────────────────────────
  // GET /admin/stats - summary for dashboard
  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },
}
