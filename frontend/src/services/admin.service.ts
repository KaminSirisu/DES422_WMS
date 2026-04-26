import api from './api'
import type {
  Item,
  Location,
  Order,
  User,
  ItemLocation,
  Role,
  SystemSettings,
  InventoryOverviewRow,
  Log,
  AuditLog
} from '../types'

export interface CreateItemPayload {
  sku?: string
  name: string
  category?: string
  minStock: number
}

export interface UpdateItemPayload {
  sku?: string
  name?: string
  category?: string
  minStock?: number
}

export interface CreateLocationPayload {
  name?: string
  zone?: string
  rack?: string
  bin?: string
  capacity?: number
}

export interface UpdateLocationPayload extends CreateLocationPayload {}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserPayload {
  username?: string
  email?: string
  role?: Role
}

export interface InventoryOverviewResponse {
  inventory: InventoryOverviewRow[]
  recentLogs: Log[]
}

export interface ActivitySummaryResponse {
  windowDays: number
  totals: {
    movements: number
    orders: number
  }
  movement: Record<string, number>
  orderStatus: Record<string, number>
}

export const adminService = {
  getItems: async (): Promise<Item[]> => {
    const { data } = await api.get<Item[]>('/admin/items')
    return data
  },

  createItem: async (payload: CreateItemPayload): Promise<Item> => {
    const { data } = await api.post<Item>('/admin/items', payload)
    return data
  },

  updateItem: async (id: number, payload: UpdateItemPayload): Promise<Item> => {
    const { data } = await api.put<Item>(`/admin/items/${id}`, payload)
    return data
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/admin/items/${id}`)
  },

  getItemLocations: async (itemId: number): Promise<ItemLocation[]> => {
    const { data } = await api.get<ItemLocation[]>(`/admin/items/${itemId}/locations`)
    return data
  },

  getLocations: async (): Promise<Location[]> => {
    const { data } = await api.get<Location[]>('/admin/locations')
    return data
  },

  createLocation: async (payload: CreateLocationPayload): Promise<Location> => {
    const { data } = await api.post<Location>('/admin/locations', payload)
    return data
  },

  updateLocation: async (id: number, payload: UpdateLocationPayload): Promise<Location> => {
    const { data } = await api.put<Location>(`/admin/locations/${id}`, payload)
    return data
  },

  deleteLocation: async (id: number): Promise<void> => {
    await api.delete(`/admin/locations/${id}`)
  },

  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/admin/orders')
    return data
  },

  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await api.put<Order>(`/admin/orders/${id}/status`, { status })
    return data
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/admin/users')
    return data
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<User>('/admin/users', payload)
    return data
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${id}`, payload)
    return data
  },

  updateUserRole: async (id: number, role: Role): Promise<User> => {
    const { data } = await api.put<User>(`/admin/users/${id}/role`, { role })
    return data
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`)
  },

  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },

  getTransfers: async () => {
    const { data } = await api.get('/admin/transfers')
    return data
  },

  createTransfer: async (payload: {
    itemId: number
    fromLocationId: number
    toLocationId: number
    quantity: number
  }) => {
    const { data } = await api.post('/admin/transfers', payload)
    return data
  },

  getLowStock: async () => {
    const { data } = await api.get('/admin/low-stock')
    return data
  },

  getInventoryOverview: async (): Promise<InventoryOverviewResponse> => {
    const { data } = await api.get<InventoryOverviewResponse>('/admin/inventory-overview')
    return data
  },

  getActivitySummary: async (days = 7): Promise<ActivitySummaryResponse> => {
    const { data } = await api.get<ActivitySummaryResponse>('/admin/activity-summary', {
      params: { days }
    })
    return data
  },

  getReports: async () => {
    const { data } = await api.get('/admin/reports')
    return data
  },

  getAuditLogs: async (params?: {
    action?: string
    entityType?: string
    userId?: number
    startDate?: string
    endDate?: string
  }): Promise<AuditLog[]> => {
    const { data } = await api.get<AuditLog[]>('/admin/audit-logs', { params })
    return data
  },

  getSettings: async (): Promise<SystemSettings> => {
    const { data } = await api.get<SystemSettings>('/admin/settings')
    return data
  },

  updateSettings: async (payload: {
    defaultReorderPoint?: number
    lowStockBuffer?: number
    allocationStrategy?: 'FIFO' | 'LIFO'
  }): Promise<SystemSettings> => {
    const { data } = await api.put<SystemSettings>('/admin/settings', payload)
    return data
  },

  adjustInventory: async (itemId: number, locationId: number, quantity: number, reason: string) => {
    const { data } = await api.post('/admin/adjust-inventory', {
      itemId,
      locationId,
      quantity,
      reason
    })
    return data
  }
}
