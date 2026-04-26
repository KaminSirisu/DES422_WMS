// ============================================================
// DASHBOARD PAGE
// แสดง: stat cards, inbound/outbound sections, low-stock alerts, order summary
// ดึงข้อมูลจาก /logs, /admin/orders, /admin/low-stock พร้อมกัน
// ============================================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Package, ArrowDownToLine, ArrowUpFromLine, ShoppingCart,
  AlertTriangle, Clock, Truck
} from 'lucide-react'
import { StatCard, Card, EmptyState, PageHeader } from '../components/ui/index'
import { getLogActionBadge, getOrderStatusBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/index'
import { logService } from '../services/log.service'
import { adminService } from '../services/admin.service'
import { useAuth } from '../context/AuthContext'
import type { Log, Order, Item } from '../types'

interface LowStockItem extends Item {
  totalStock: number
}

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<Log[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const promises = [
          logService.getAll(),
          isAdmin ? adminService.getOrders() : Promise.resolve([]),
          isAdmin ? adminService.getLowStock() : Promise.resolve([]),
        ]
        const [logsRes, ordersRes, lowStockRes] = await Promise.allSettled(promises)
        
        if (logsRes.status === 'fulfilled') {
          const logsData = logsRes.value
          setLogs(Array.isArray(logsData) ? logsData : (logsData as any)?.logs ?? [])
        }
        if (ordersRes.status === 'fulfilled') {
          const ordersData = ordersRes.value
          setOrders(Array.isArray(ordersData) ? ordersData : (ordersData as any)?.orders ?? [])
        }
        if (lowStockRes.status === 'fulfilled') {
          setLowStockItems(lowStockRes.value)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [isAdmin])

  // ── Compute stats from data ─────────────────────────────
  const todayStr = new Date().toDateString()
  const todayLogs = logs.filter(l => new Date(l.createdAt).toDateString() === todayStr)
  const inboundLogs = todayLogs.filter(l => l.action === 'ADD')
  const outboundLogs = todayLogs.filter(l => l.action === 'WITHDRAW')
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'BACKLOG')

  if (isLoading) {
    return <Spinner className="h-96" size="lg" />
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Last updated: ${new Date().toLocaleTimeString()}`}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard
          title="Inbound Today"
          value={inboundLogs.reduce((s, l) => s + l.quantity, 0)}
          icon={<ArrowDownToLine className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-100"
          trend="vs yesterday"
          trendUp
        />
        <StatCard
          title="Outbound Today"
          value={outboundLogs.reduce((s, l) => s + l.quantity, 0)}
          icon={<ArrowUpFromLine className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Pending / Backlog"
          value={pendingOrders.length}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
          trend={pendingOrders.length > 0 ? 'needs attention' : undefined}
          trendUp={false}
        />
      </div>

      {/* Low Stock Alert Section (Admin only) */}
      {isAdmin && lowStockItems.length > 0 && (
        <div className="mb-6">
          <Card className="border-l-4 border-l-red-500 bg-red-50/30">
            <div className="flex items-center justify-between border-b border-red-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-semibold text-red-900">⚠️ Low Stock Alert</h2>
              </div>
              <span className="text-xs text-red-600 font-medium">{lowStockItems.length} item(s)</span>
            </div>

            <div className="divide-y divide-red-100">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/50 transition-colors cursor-pointer" onClick={() => navigate('/inbound')}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <Package className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">{item.name}</p>
                      <p className="text-[11px] text-red-600 font-semibold">Stock: {item.totalStock} / Min: {item.minStock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full"
                        style={{ width: `${(item.totalStock / item.minStock) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Inbound & Outbound Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Inbound Section */}
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-gray-800">Inbound</h2>
            </div>
            <span className="text-xs text-gray-400">
              {inboundLogs.reduce((s, l) => s + l.quantity, 0)} items today
            </span>
          </div>

          {inboundLogs.length === 0 ? (
            <EmptyState message="No inbound today" />
          ) : (
            <div className="divide-y divide-gray-50">
              {inboundLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {log.item?.name ?? `Item #${log.itemId}`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {log.location?.name ?? `Loc #${log.locationId}`} · {log.user?.username}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-brand-600">
                    +{log.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Outbound Section */}
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-800">Outbound</h2>
            </div>
            <span className="text-xs text-gray-400">
              {outboundLogs.reduce((s, l) => s + l.quantity, 0)} items today
            </span>
          </div>

          {outboundLogs.length === 0 ? (
            <EmptyState message="No outbound today" />
          ) : (
            <div className="divide-y divide-gray-50">
              {outboundLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {log.item?.name ?? `Item #${log.itemId}`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {log.location?.name ?? `Loc #${log.locationId}`} · {log.user?.username}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-blue-600">
                    -{log.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <span className="text-xs text-gray-400">Today</span>
          </div>

          {todayLogs.length === 0 ? (
            <EmptyState message="No activity today" />
          ) : (
            <div className="divide-y divide-gray-50">
              {todayLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <Package className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {log.item?.name ?? `Item #${log.itemId}`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {log.location?.name ?? `Loc #${log.locationId}`} · {log.user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getLogActionBadge(log.action)}
                    <span className="text-xs font-mono text-gray-500">×{log.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Order Status Summary */}
        <Card>
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
          </div>

          {orders.length === 0 ? (
            <EmptyState message="No orders yet" />
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-800 font-mono">
                      ORD-{String(order.id).padStart(4, '0')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {order.lines?.length ?? 0} line(s) ·{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {getOrderStatusBadge(order.status)}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
