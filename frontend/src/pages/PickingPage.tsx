// ============================================================
// PICKING & SHIPPING PAGE (Warehouse Operations)
// User picks items from orders and marks ready for shipment
// ============================================================

import { useState } from 'react'
import { CheckCircle, Package, ShoppingCart, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { orderService } from '../services/order.service'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'
import { getOrderStatusBadge } from '../components/ui/Badge'

export function PickingPage() {
  const { data: orders, isLoading, refetch } = useApi(() => orderService.getPendingPickingOrders())
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)

  const selectedOrder = orders?.find(o => o.id === selectedOrderId)

  // ── Start picking (change status to PROCESSING) ──────────
  const handleStartPicking = async (orderId: number) => {
    setActionInProgress(orderId)
    try {
      await orderService.updateStatus(orderId, 'PROCESSING')
      toast.success('Picking started')
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to start picking'
      toast.error(msg)
    } finally {
      setActionInProgress(null)
    }
  }

  // ── Complete order (mark as COMPLETED / ready to ship) ────
  const handleCompleteOrder = async (orderId: number) => {
    setActionInProgress(orderId)
    try {
      await orderService.updateStatus(orderId, 'COMPLETED')
      toast.success('Order ready for shipment!')
      refetch()
      setSelectedOrderId(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to complete order'
      toast.error(msg)
    } finally {
      setActionInProgress(null)
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  const pendingCount = orders?.filter(o => o.status === 'PENDING' || o.status === 'BACKLOG').length ?? 0
  const processingCount = orders?.filter(o => o.status === 'PROCESSING').length ?? 0

  return (
    <div>
      <PageHeader
        title="Picking & Shipping"
        subtitle={`${pendingCount} pending • ${processingCount} in progress`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ShoppingCart className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-800">Pick Queue</h2>
            </div>

            {!orders || orders.length === 0 ? (
              <EmptyState message="No orders to pick" />
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left px-5 py-3 hover:bg-gray-50/60 transition-colors border-l-4 ${
                      selectedOrderId === order.id ? 'bg-brand-50 border-l-brand-500' : 'border-l-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-800 font-mono">
                          ORD-{String(order.id).padStart(4, '0')}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {order.lines?.length ?? 0} item(s)
                        </p>
                      </div>
                      <div>
                        {getOrderStatusBadge(order.status)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Order Details & Actions */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <Card>
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Details</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ORD-{String(selectedOrder.id).padStart(4, '0')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer: {selectedOrder.user?.username}
                    </p>
                  </div>
                  <div>
                    {getOrderStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {/* Order Lines */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-3">Items to Pick</p>
                <div className="space-y-2">
                  {selectedOrder.lines?.map((line) => (
                    <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{line.item?.name}</p>
                          <p className="text-xs text-gray-500">
                            Order: {line.quantity} • Fulfilled: {line.fulfilled}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600">×{line.quantity - line.fulfilled}</p>
                        <p className="text-xs text-gray-400">remaining</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-4 flex gap-3">
                {selectedOrder.status === 'PENDING' || selectedOrder.status === 'BACKLOG' ? (
                  <Button
                    onClick={() => handleStartPicking(selectedOrder.id)}
                    isLoading={actionInProgress === selectedOrder.id}
                    className="flex-1"
                  >
                    <Truck className="h-4 w-4" />
                    Start Picking
                  </Button>
                ) : selectedOrder.status === 'PROCESSING' ? (
                  <Button
                    onClick={() => handleCompleteOrder(selectedOrder.id)}
                    isLoading={actionInProgress === selectedOrder.id}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Ready to Ship
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center gap-2 justify-center p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600 font-medium">Completed</span>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Select an order to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
