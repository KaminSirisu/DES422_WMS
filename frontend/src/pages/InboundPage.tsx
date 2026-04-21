// ============================================================
// INBOUND PAGE (Admin only)
// POST /inbound - เพิ่มสต็อกเข้า location ที่เลือก
// Backend จะ auto-process backlog orders อัตโนมัติ
// ============================================================

import { useState } from 'react'
import { ArrowDownToLine, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { inboundService } from '../services/inbound.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'

interface InboundForm {
  itemId: string
  locationId: string
  quantity: string
}

export function InboundPage() {
  // ดึง items และ locations สำหรับ dropdown
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  const { data: locations, isLoading: locationsLoading } = useApi(() => adminService.getLocations())

  const [form, setForm] = useState<InboundForm>({ itemId: '', locationId: '', quantity: '' })
  const [errors, setErrors] = useState<InboundForm>({ itemId: '', locationId: '', quantity: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const isLoading = itemsLoading || locationsLoading

  // ── Validate ──────────────────────────────────────────
  const validate = (): boolean => {
    const errs = { itemId: '', locationId: '', quantity: '' }
    if (!form.itemId) errs.itemId = 'Select an item'
    if (!form.locationId) errs.locationId = 'Select a location'
    if (!form.quantity || Number(form.quantity) <= 0)
      errs.quantity = 'Quantity must be > 0'
    setErrors(errs)
    return !errs.itemId && !errs.locationId && !errs.quantity
  }

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await inboundService.addStock({
        itemId: Number(form.itemId),
        locationId: Number(form.locationId),
        quantity: Number(form.quantity),
      })
      toast.success(result.message || 'Stock added successfully')
      setLastResult(result.message)
      setForm({ itemId: '', locationId: '', quantity: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to add stock'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  const selectedItem = items?.find(i => i.id === Number(form.itemId))

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Stock Receiving"
        subtitle="Add incoming stock to a warehouse location"
      />

      {/* Success banner */}
      {lastResult && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700">{lastResult}</p>
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
            <ArrowDownToLine className="h-4 w-4 text-brand-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">New Stock Receipt</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item select */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Item <span className="text-red-400">*</span>
            </label>
            <select
              value={form.itemId}
              onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Select item --</option>
              {items?.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {errors.itemId && <p className="text-xs text-red-500">{errors.itemId}</p>}
          </div>

          {/* Location select */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Location <span className="text-red-400">*</span>
            </label>
            <select
              value={form.locationId}
              onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Select location --</option>
              {locations?.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.capacity ? ` (cap: ${loc.capacity})` : ''}
                </option>
              ))}
            </select>
            {errors.locationId && <p className="text-xs text-red-500">{errors.locationId}</p>}
          </div>

          {/* Quantity */}
          <Input
            label="Quantity *"
            type="number"
            min={1}
            placeholder="0"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            error={errors.quantity}
          />

          {/* Preview */}
          {selectedItem && form.quantity && Number(form.quantity) > 0 && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm">
              <p className="font-medium text-brand-700">Receipt Preview</p>
              <div className="mt-2 space-y-1 text-brand-600">
                <p>Item: <strong>{selectedItem.name}</strong></p>
                <p>Quantity: <strong>+{form.quantity} units</strong></p>
                <p className="text-xs text-brand-500 mt-2">
                  ⚡ Backend will automatically fulfill any backlog orders for this item
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm({ itemId: '', locationId: '', quantity: '' })
                setLastResult(null)
              }}
            >
              Clear
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
