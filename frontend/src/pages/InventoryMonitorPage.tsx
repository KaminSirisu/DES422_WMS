import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui/index'
import { Button } from '../components/ui/Button'
import { getLogActionBadge, getOrderStatusBadge } from '../components/ui/Badge'
import type { OrderStatus } from '../types'

export function InventoryMonitorPage() {
  const [windowDays, setWindowDays] = useState(7)
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useApi(() => adminService.getInventoryOverview())
  const { data: orders, isLoading: ordersLoading } = useApi(() => adminService.getOrders())
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useApi(
    () => adminService.getActivitySummary(windowDays),
    [windowDays]
  )

  const isLoading = overviewLoading || ordersLoading || summaryLoading
  const lowStockCount = useMemo(
    () => overview?.inventory.filter(row => row.totalStock < row.minStock).length ?? 0,
    [overview]
  )

  const handleRefresh = () => {
    refetchOverview()
    refetchSummary()
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Inventory Monitor"
        subtitle="Real-time inventory, movement, and order activity"
        action={
          <Button variant="secondary" size="sm" onClick={handleRefresh} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Tracked SKUs</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{overview?.inventory.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Low Stock SKUs</p>
          <p className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {lowStockCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Orders By Status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(summary?.orderStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1 text-xs">
                {getOrderStatusBadge(status as OrderStatus)}
                <span className="font-semibold text-gray-700">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Inventory Snapshot</h2>
              <p className="text-xs text-gray-400">Stock visibility by SKU and location spread</p>
            </div>
          </div>
          {!overview?.inventory.length ? (
            <EmptyState message="No inventory records found" />
          ) : (
            <div className="max-h-[450px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['SKU', 'Item', 'Category', 'Stock', 'Min', 'Locations'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overview.inventory.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{row.sku}</td>
                      <td className="px-5 py-3 text-xs font-medium text-gray-800">{row.name}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.category || '-'}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-800">{row.totalStock}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.minStock}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.locationCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Recent Inventory Activity</h2>
              <p className="text-xs text-gray-400">Latest stock movement and operator action</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1">
              <Activity className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value))}
                className="bg-transparent text-xs text-gray-700 outline-none"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          {(overview?.recentLogs?.length ?? 0) === 0 ? (
            <EmptyState message="No movement activity found" />
          ) : (
            <div className="max-h-[450px] overflow-auto divide-y divide-gray-50">
              {overview?.recentLogs.slice(0, 50).map(log => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{log.item?.name || `Item #${log.itemId}`}</p>
                    <p className="text-[11px] text-gray-400">
                      {log.location?.name || `Loc #${log.locationId}`} · {log.user?.username || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div>{getLogActionBadge(log.action)}</div>
                    <p className="mt-1 text-xs font-mono text-gray-500">x{log.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-gray-800">Order Status Monitoring</h2>
        </div>
        {!orders?.length ? (
          <EmptyState message="No orders found" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {orders.slice(0, 20).map(order => (
              <div key={order.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs">
                <span className="font-mono text-gray-500">ORD-{String(order.id).padStart(4, '0')}</span>
                {getOrderStatusBadge(order.status)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
