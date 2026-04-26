// ============================================================
// TYPES - ต้องตรงกับ Prisma Schema และ API Response
// ============================================================

// Enums จาก Prisma
export type Role = 'user' | 'staff' | 'admin'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'BACKLOG'
export type LogAction = 'WITHDRAW' | 'ADD' | 'TRANSFER_OUT' | 'TRANSFER_IN'
export type AllocationStrategy = 'FIFO' | 'LIFO'

// ── AUTH ──────────────────────────────────────────────────
export interface LoginPayload {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
}

// JWT decode payload (สิ่งที่เก็บใน token)
export interface TokenPayload {
  id: number
  role: Role
  iat: number
  exp: number
}

// ── USER ──────────────────────────────────────────────────
export interface User {
  id: number
  username: string
  email?: string
  role: Role
  createdAt: string
}

// ── ITEM ──────────────────────────────────────────────────
export interface Item {
  id: number
  sku: string
  name: string
  category?: string | null
  minStock: number
  createdAt: string
  locations?: ItemLocation[]
}

// ── LOCATION ──────────────────────────────────────────────
export interface Location {
  id: number
  name: string
  zone?: string | null
  rack?: string | null
  bin?: string | null
  capacity?: number
  createdAt: string
}

// ── ITEM LOCATION (stock per location) ────────────────────
export interface ItemLocation {
  id: number
  itemId: number
  locationId: number
  quantity: number
  item?: Item
  location?: Location
}

// ── INBOUND ───────────────────────────────────────────────
export interface InboundPayload {
  itemId: number
  locationId: number
  quantity: number
}

export interface InboundResponse {
  message: string
  stock: ItemLocation
}

// ── ORDER ─────────────────────────────────────────────────
export interface OrderLine {
  id: number
  orderId: number
  itemId: number
  quantity: number
  fulfilled: number
  item?: Item
}

export interface Order {
  id: number
  userId: number
  status: OrderStatus
  createdAt: string
  user?: User
  lines: OrderLine[]
}

export interface CreateOrderPayload {
  items: {
    itemId: number
    quantity: number
  }[]
}

// ── LOG ───────────────────────────────────────────────────
export interface Log {
  id: number
  userId: number
  itemId: number
  locationId: number
  quantity: number
  action: LogAction
  reason?: string | null
  createdAt: string
  user?: { username: string }
  item?: { name: string }
  location?: { name: string }
}

// ── ADMIN DASHBOARD ────────────────────────────────────────
// ข้อมูลสำหรับแสดงใน Dashboard (รวมจากหลาย endpoint)
export interface DashboardStats {
  totalItems: number
  totalLocations: number
  totalOrders: number
  pendingOrders: number
  recentLogs: Log[]
}

export interface SystemSettings {
  id: number
  defaultReorderPoint: number
  lowStockBuffer: number
  allocationStrategy: AllocationStrategy
  updatedAt: string
}

export interface InventoryOverviewRow {
  id: number
  sku: string
  name: string
  category?: string | null
  minStock: number
  totalStock: number
  locationCount: number
}

export interface AuditLog {
  id: number
  userId?: number | null
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  user?: { id: number; username: string; role: Role }
}

// ── API ERROR ─────────────────────────────────────────────
export interface ApiError {
  message: string
}

// ── WITHDRAW (Admin only) ──────────────────────────────────
export interface WithdrawPayload {
  itemId: number
  locationId: number
  quantity: number
}

// ── TRANSFER ───────────────────────────────────────────────
export interface Transfer {
  id: number
  itemId: number
  fromLocationId: number
  toLocationId: number
  userId: number
  quantity: number
  createdAt: string
  item?: Item
  fromLocation?: Location
  toLocation?: Location
  user?: { id: number; username: string }
}

export interface TransferPayload {
  itemId: number
  fromLocationId: number
  toLocationId: number
  quantity: number
}
