import { useState } from 'react'
import { ClipboardCheck, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { staffService } from '../services/staff.service'
import { Card, PageHeader, Spinner } from '../components/ui/index'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function CycleCountPage() {
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  const { data: locations, isLoading: locationsLoading } = useApi(() => adminService.getLocations())

  const [itemId, setItemId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [countedQuantity, setCountedQuantity] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ oldQuantity: number; newQuantity: number; delta: number } | null>(null)

  if (itemsLoading || locationsLoading) return <Spinner className="h-96" size="lg" />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId || !locationId || countedQuantity === '') {
      toast.error('Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await staffService.cycleCount({
        itemId: Number(itemId),
        locationId: Number(locationId),
        countedQuantity: Number(countedQuantity),
        note: note || undefined,
      })
      setResult(response)
      toast.success(response.message)
      setCountedQuantity('')
      setNote('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to record cycle count'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Cycle Count"
        subtitle="Count stock on location and update the system with the verified quantity"
      />

      {result && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <p className="text-sm text-emerald-700">
            Count saved: {result.oldQuantity} to {result.newQuantity} ({result.delta > 0 ? '+' : ''}{result.delta})
          </p>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Count Submission</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Item *</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Select item --</option>
              {items?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Select location --</option>
              {locations?.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Counted Quantity *"
            type="number"
            min={0}
            value={countedQuantity}
            onChange={(e) => setCountedQuantity(e.target.value)}
            placeholder="0"
          />

          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reason or counting note"
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>Record Count</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
