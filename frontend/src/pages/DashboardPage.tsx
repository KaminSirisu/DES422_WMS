// ============================================================
// DASHBOARD PAGE
// แสดง: stat cards, recent logs table, order summary
// ดึงข้อมูลจาก /logs และ /admin/orders พร้อมกัน
// ============================================================

import { useEffect, useState } from 'react'
import {
  Package, ArrowDownToLine, ShoppingCart,
  AlertTriangle, TrendingUp, Clock
} from 'lucide-react'
import { StatCard, Card, EmptyState, PageHeader } from '../components/ui/index'
import { getLogActionBadge, getOrderStatusBadge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/index'
import { logService } from '../services/log.service'
import { adminService } from '../services/admin.service'
import type { Log, Order } from '../types'

export function DashboardPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ดึงข้อมูลพร้อมกันด้วย Promise.allSettled (ถ้าอันนึงพัง อีกอันยังทำงานต่อ)
        const [logsRes, ordersRes] = await Promise.allSettled([
          logService.getAll(),
          adminService.getOrders(),
        ])
        if (logsRes.status === 'fulfilled') setLogs(Array.isArray(logsRes.value) ? logsRes.value : (logsRes.value as any)?.logs ?? (logsRes.value as any)?.data ?? [])
        if (ordersRes.status === 'fulfilled') setOrders(Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value as any)?.orders ?? (ordersRes.value as any)?.data ?? [])
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Compute stats from data ─────────────────────────────
  const todayStr = new Date().toDateString()
  const todayLogs = logs.filter(l => new Date(l.createdAt).toDateString() === todayStr)
  const addLogs = todayLogs.filter(l => l.action === 'ADD')
  const withdrawLogs = todayLogs.filter(l => l.action === 'WITHDRAW')
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
          title="Items Received Today"
          value={addLogs.reduce((s, l) => s + l.quantity, 0)}
          icon={<ArrowDownToLine className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-100"
          trend="vs yesterday"
          trendUp
        />
        <StatCard
          title="Items Shipped Today"
          value={withdrawLogs.reduce((s, l) => s + l.quantity, 0)}
          icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
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
