// ============================================================
// TRANSFER PAGE (Admin only)
// POST /admin/transfers - ย้ายสต็อกระหว่าง locations
// ============================================================

import { useState } from 'react'
import { ArrowLeftRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'

interface TransferForm {
  itemId: string
  fromLocationId: string
  toLocationId: string
  quantity: string
}

export function TransferPage() {
  // ดึง items และ locations สำหรับ dropdown
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  const { data: locations, isLoading: locationsLoading } = useApi(() => adminService.getLocations())

  const [form, setForm] = useState<TransferForm>({
    itemId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: ''
  })
  const [errors, setErrors] = useState<TransferForm>({
    itemId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  const isLoading = itemsLoading || locationsLoading

  // ── Validate ──────────────────────────────────────────
  const validate = (): boolean => {
    const errs = { itemId: '', fromLocationId: '', toLocationId: '', quantity: '' }
    if (!form.itemId) errs.itemId = 'Select an item'
    if (!form.fromLocationId) errs.fromLocationId = 'Select source location'
    if (!form.toLocationId) errs.toLocationId = 'Select destination location'
    if (form.fromLocationId === form.toLocationId) {
      errs.toLocationId = 'Cannot transfer to the same location'
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      errs.quantity = 'Quantity must be > 0'
    }
    setErrors(errs)
    return !errs.itemId && !errs.fromLocationId && !errs.toLocationId && !errs.quantity
  }

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await adminService.createTransfer({
        itemId: Number(form.itemId),
        fromLocationId: Number(form.fromLocationId),
        toLocationId: Number(form.toLocationId),
        quantity: Number(form.quantity),
      })
      toast.success('Transfer completed successfully')
      setLastResult(`Transferred ${form.quantity} units of ${result.item?.name} from ${result.fromLocation?.name} to ${result.toLocation?.name}`)
      setForm({ itemId: '', fromLocationId: '', toLocationId: '', quantity: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to transfer stock'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  const selectedItem = items?.find(i => i.id === Number(form.itemId))
  const fromLocation = locations?.find(l => l.id === Number(form.fromLocationId))
  const toLocation = locations?.find(l => l.id === Number(form.toLocationId))

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Stock Transfer"
        subtitle="Move stock between warehouse locations"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">New Stock Transfer</h2>
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

          {/* From Location */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              From Location <span className="text-red-400">*</span>
            </label>
            <select
              value={form.fromLocationId}
              onChange={e => setForm(f => ({ ...f, fromLocationId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Select source location --</option>
              {locations?.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.capacity ? ` (cap: ${loc.capacity})` : ''}
                </option>
              ))}
            </select>
            {errors.fromLocationId && <p className="text-xs text-red-500">{errors.fromLocationId}</p>}
          </div>

          {/* To Location */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              To Location <span className="text-red-400">*</span>
            </label>
            <select
              value={form.toLocationId}
              onChange={e => setForm(f => ({ ...f, toLocationId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
                         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Select destination location --</option>
              {locations?.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}{loc.capacity ? ` (cap: ${loc.capacity})` : ''}
                </option>
              ))}
            </select>
            {errors.toLocationId && <p className="text-xs text-red-500">{errors.toLocationId}</p>}
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
          {selectedItem && fromLocation && toLocation && form.quantity && Number(form.quantity) > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm">
              <p className="font-medium text-blue-700">Transfer Preview</p>
              <div className="mt-2 space-y-1 text-blue-600">
                <p>Item: <strong>{selectedItem.name}</strong></p>
                <p>From: <strong>{fromLocation.name}</strong></p>
                <p>To: <strong>{toLocation.name}</strong></p>
                <p>Quantity: <strong>{form.quantity} units</strong></p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setForm({ itemId: '', fromLocationId: '', toLocationId: '', quantity: '' })
                setLastResult(null)
              }}
            >
              Clear
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}