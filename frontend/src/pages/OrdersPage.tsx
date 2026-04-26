// ============================================================
// ORDERS PAGE
// - User: สร้าง order ใหม่ + ดู order ของตัวเอง + ยกเลิกได้
// - Admin: ดู orders ทั้งหมด
// POST /orders, GET /orders/me, PUT /orders/:id/cancel, GET /admin/orders
// ============================================================

import { useState } from 'react'
import { Plus, Trash2, ShoppingCart, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { orderService } from '../services/order.service'
import { useAuth } from '../context/AuthContext'
import type { Item } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'
import { getOrderStatusBadge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'

interface OrderLineInput {
  itemId: string
  quantity: string
}

export function OrdersPage() {
  const { isAdmin } = useAuth()

  // ดึง orders: admin ดูทั้งหมด, user ดูของตัวเอง
  const { data: orders, isLoading: ordersLoading, refetch } = useApi(
    () => isAdmin ? adminService.getOrders() : orderService.getMyOrders()
  )
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  // ดึง stock ทุก location สำหรับแสดงใน form
  const { data: allStocks, isLoading: stockLoading } = useApi(async () => {
    const itemsList = await adminService.getItems()
    const stocks: Record<number, number> = {}
    for (const item of itemsList) {
      const locs = await adminService.getItemLocations(item.id)
      stocks[item.id] = locs.reduce((sum, l) => sum + l.quantity, 0)
    }
    return stocks
  })

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Dynamic order lines: เพิ่ม/ลบ items ใน order ได้
  const [lines, setLines] = useState<OrderLineInput[]>([{ itemId: '', quantity: '1' }])

  const isLoading = ordersLoading || itemsLoading || stockLoading

  // ── Line management ───────────────────────────────────
  const addLine = () => setLines(l => [...l, { itemId: '', quantity: '1' }])

  const removeLine = (idx: number) => {
    if (lines.length === 1) return  // ต้องมีอย่างน้อย 1 line
    setLines(l => l.filter((_, i) => i !== idx))
  }

  const updateLine = (idx: number, field: keyof OrderLineInput, value: string) => {
    setLines(l => l.map((line, i) => i === idx ? { ...line, [field]: value } : line))
  }

  // ── Submit order ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate: ทุก line ต้องมี item + quantity > 0
    const invalid = lines.some(l => !l.itemId || Number(l.quantity) <= 0)
    if (invalid) {
      toast.error('Please fill in all order lines correctly')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await orderService.create({
        items: lines.map(l => ({
          itemId:   Number(l.itemId),
          quantity: Number(l.quantity),
        })),
      })
      toast.success(`Order created! Status: ${result.order.status}`)
      if (result.order.status === 'BACKLOG') {
        toast('Some items were in backlog — will fulfill when stock arrives', { icon: '⚠️' })
      }
      setShowModal(false)
      setLines([{ itemId: '', quantity: '1' }])
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to create order'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemName = (items: Item[] | null, id: number) =>
    items?.find(i => i.id === id)?.name ?? `Item #${id}`

  // ── Cancel order ─────────────────────────────────────
  const handleCancel = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    
    try {
      await orderService.cancel(orderId)
      toast.success('Order cancelled')
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to cancel order'
      toast.error(msg)
    }
  }

  // Check if order can be cancelled (only PENDING or BACKLOG)
  const canCancel = (status: string) => status === 'PENDING' || status === 'BACKLOG'

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={isAdmin ? `${orders?.length ?? 0} orders total` : 'Create a new order'}
        action={
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus />}>
            New Order
          </Button>
        }
      />

      <Card>
        {!orders || orders.length === 0 ? (
          <EmptyState message={isAdmin ? 'No orders yet' : 'You have no orders'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Lines</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Items</th>
                  {!isAdmin && <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">
                      ORD-{String(order.id).padStart(4, '0')}
                    </td>
                    <td className="px-5 py-3">{getOrderStatusBadge(order.status)}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{order.lines?.length ?? 0} line(s)</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.lines?.slice(0, 3).map(line => (
                          <span key={line.id} className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                            {getItemName(items, line.itemId)} ×{line.quantity}
                            {line.fulfilled < line.quantity && (
                              <span className="text-amber-500 ml-1">(partial)</span>
                            )}
                          </span>
                        ))}
                        {(order.lines?.length ?? 0) > 3 && (
                          <span className="text-xs text-gray-400">+{(order.lines?.length ?? 0) - 3} more</span>
                        )}
                      </div>
                    </td>
                    {!isAdmin && (
                      <td className="px-5 py-3">
                        {canCancel(order.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(order.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Order Items</p>
              <Button type="button" variant="ghost" size="sm" onClick={addLine} leftIcon={<Plus />}>
                Add Line
              </Button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {/* Item select */}
                <div className="flex-1">
                  <select
                    value={line.itemId}
                    onChange={e => updateLine(idx, 'itemId', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                               focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Select item --</option>
                    {items?.map(item => {
                      const stock = allStocks?.[item.id] ?? 0
                      return (
                        <option key={item.id} value={item.id} disabled={stock === 0}>
                          {item.name} {stock > 0 ? `(stock: ${stock})` : '(out of stock)'}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-24">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={e => updateLine(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                </div>

                {/* Remove line */}
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  className="mt-1.5 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500
                             disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <p className="flex items-center gap-2">
              <ShoppingCart className="h-3.5 w-3.5" />
              {lines.filter(l => l.itemId).length} item type(s) ·{' '}
              {lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)} units total
            </p>
            <p className="mt-1 text-gray-400">
              If stock is insufficient, order will be placed in BACKLOG and auto-fulfilled when stock arrives.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Place Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
