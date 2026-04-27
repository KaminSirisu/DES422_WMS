import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Package,
  ShoppingCart,
  Truck,
  Search
} from 'lucide-react'
import { Card, EmptyState, PageHeader, Spinner, StatCard } from '../components/ui/index'
import { getLogActionBadge, getOrderStatusBadge } from '../components/ui/Badge'
import { adminService } from '../services/admin.service'
import { logService } from '../services/log.service'
import { orderService } from '../services/order.service'
import { useAuth } from '../context/AuthContext'
import type { Item, Log, Order } from '../types'

interface LowStockItem extends Item {
  totalStock: number
}

export function DashboardPage() {
  const { isAdmin, isStaff, user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<Log[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lowStockSearch, setLowStockSearch] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      try {
        if (isAdmin || isStaff) {
          const [logsRes, ordersRes, lowStockRes] = await Promise.allSettled([
            logService.getAll(),
            adminService.getOrders(),
            adminService.getLowStock(),
          ])

          setLogs(logsRes.status === 'fulfilled' ? logsRes.value : [])
          setOrders(ordersRes.status === 'fulfilled' ? ordersRes.value : [])
          setLowStockItems(lowStockRes.status === 'fulfilled' ? lowStockRes.value : [])
          return
        }

        const myOrders = await orderService.getMyOrders()
        setOrders(myOrders)
        setLogs([])
        setLowStockItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [isAdmin, isStaff])

  const todayStr = new Date().toDateString()
  const todayLogs = logs.filter((log) => new Date(log.createdAt).toDateString() === todayStr)
  const inboundLogs = todayLogs.filter((log) => log.action === 'ADD')
  const outboundLogs = todayLogs.filter((log) => log.action === 'WITHDRAW')

  const pendingOrders = orders.filter((order) => order.status === 'PENDING')
  const processingOrders = orders.filter((order) => order.status === 'PROCESSING')
  const backlogOrders = orders.filter((order) => order.status === 'BACKLOG')
  const completedOrders = orders.filter((order) => order.status === 'COMPLETED')

  const filteredLowStockItems = lowStockItems.filter(item =>
    item.name.toLowerCase().includes(lowStockSearch.toLowerCase())
  )

  if (isLoading) return <Spinner className="h-96" size="lg" />

  if (isAdmin || isStaff) {
    return (
      <div>
        <PageHeader
          title={isAdmin ? 'Dashboard' : 'Operations Dashboard'}
          subtitle={`Last updated: ${new Date().toLocaleTimeString()}`}
        />

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Inbound Today"
            value={inboundLogs.reduce((sum, log) => sum + log.quantity, 0)}
            icon={<ArrowDownToLine className="h-5 w-5 text-brand-600" />}
            iconBg="bg-brand-100"
          />
          <StatCard
            title="Outbound Today"
            value={outboundLogs.reduce((sum, log) => sum + log.quantity, 0)}
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
            value={pendingOrders.length + backlogOrders.length}
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-6">
            <Card className="border-l-4 border-l-red-500 bg-red-50/30">
              <div className="border-b border-red-200 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <h2 className="text-sm font-semibold text-red-900">Low Stock Alert</h2>
                  </div>
                  <span className="text-xs font-medium text-red-600">{lowStockItems.length} item(s)</span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search low stock items..."
                    value={lowStockSearch}
                    onChange={(e) => setLowStockSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                </div>
              </div>

              {/* Results */}
              {filteredLowStockItems.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  {lowStockSearch ? (
                    <p className="text-xs text-gray-400">No items match "<strong>{lowStockSearch}</strong>"</p>
                  ) : (
                    <p className="text-xs text-gray-400">Enter search term above to filter items</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-red-100 max-h-64 overflow-y-auto">
                  {filteredLowStockItems.slice(0, 20).map((item) => (
                    <div
                      key={item.id}
                      className="flex cursor-pointer items-center justify-between px-5 py-3 transition-colors hover:bg-red-50/50"
                      onClick={() => navigate(isStaff ? '/picking' : '/inbound')}
                    >
                      <div className="flex flex-1 items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                          <Package className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-[11px] font-semibold text-red-600">
                            {item.totalStock} / {item.minStock}
                          </p>
                        </div>
                      </div>
                      <div className="w-12 flex-shrink-0 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-red-500"
                          style={{ width: `${Math.min(100, (item.totalStock / Math.max(item.minStock, 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {filteredLowStockItems.length > 20 && (
                    <div className="px-5 py-2 text-center text-[11px] text-gray-400">
                      +{filteredLowStockItems.length - 20} more items
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inbound */}
          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-gray-800">Inbound</h2>
              </div>
              <span className="text-xs text-gray-400">{inboundLogs.length} today</span>
            </div>
            {inboundLogs.length === 0 ? (
              <EmptyState message="No inbound today" />
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {inboundLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-2 text-xs hover:bg-gray-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{log.item?.name ?? `Item #${log.itemId}`}</p>
                      <p className="text-[11px] text-gray-400 truncate">{log.location?.name ?? `Loc #${log.locationId}`} · {log.user?.username}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-brand-600 flex-shrink-0 ml-2">+{log.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Outbound */}
          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-800">Outbound</h2>
              </div>
              <span className="text-xs text-gray-400">{outboundLogs.length} today</span>
            </div>
            {outboundLogs.length === 0 ? (
              <EmptyState message="No outbound today" />
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {outboundLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-2 text-xs hover:bg-gray-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{log.item?.name ?? `Item #${log.itemId}`}</p>
                      <p className="text-[11px] text-gray-400 truncate">{log.location?.name ?? `Loc #${log.locationId}`} · {log.user?.username}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-blue-600 flex-shrink-0 ml-2">-{log.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
              </div>
              <span className="text-xs text-gray-400">{todayLogs.length} today</span>
            </div>
            {todayLogs.length === 0 ? (
              <EmptyState message="No activity today" />
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {todayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-2 text-xs hover:bg-gray-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{log.item?.name ?? `Item #${log.itemId}`}</p>
                      <p className="text-[11px] text-gray-400 truncate">{log.location?.name} · {log.user?.username}</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getLogActionBadge(log.action)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Orders */}
          <Card>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
              </div>
              <span className="text-xs text-gray-400">{orders.length} total</span>
            </div>
            {orders.length === 0 ? (
              <EmptyState message="No orders" />
            ) : (
              <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {orders.slice(0, 50).map((order) => (
                  <div key={order.id} className="flex items-center justify-between px-5 py-2 text-xs hover:bg-gray-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-medium text-gray-800">ORD-{String(order.id).padStart(4, '0')}</p>
                      <p className="text-[11px] text-gray-400">{order.user?.username ?? 'Unknown'} · {order.lines?.length ?? 0} item(s)</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {getOrderStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle={`Welcome back, ${user?.username ?? 'Customer'}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="My Orders"
          value={orders.length}
          icon={<ShoppingCart className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-100"
        />
        <StatCard
          title="Pending"
          value={pendingOrders.length}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-100"
          subtitle="Waiting for warehouse review"
        />
        <StatCard
          title="Processing"
          value={processingOrders.length}
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          subtitle="Being picked and packed"
        />
        <StatCard
          title="Completed"
          value={completedOrders.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          subtitle="Ready or finished"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">My Recent Orders</h2>
          </div>
          {orders.length === 0 ? (
            <EmptyState message="You have not placed any orders yet" />
          ) : (
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-2 text-xs hover:bg-gray-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-semibold text-gray-800">ORD-{String(order.id).padStart(4, '0')}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {order.lines?.length ?? 0} line(s) · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {getOrderStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">Order Status Summary</h2>
          </div>
          <div className="space-y-3 px-5 py-5">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-lg font-bold text-gray-900">{pendingOrders.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Processing</span>
              <span className="text-lg font-bold text-gray-900">{processingOrders.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Backlog</span>
              <span className="text-lg font-bold text-gray-900">{backlogOrders.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-lg font-bold text-gray-900">{completedOrders.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
