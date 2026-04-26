import { useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { staffService } from '../services/staff.service'
import { Card, PageHeader, Spinner } from '../components/ui/index'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

const ISSUE_TYPES = ['Damaged goods', 'Missing item', 'Incomplete shipment', 'Wrong quantity', 'Other']

export function ReportIssuesPage() {
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  const { data: locations, isLoading: locationsLoading } = useApi(() => adminService.getLocations())

  const [itemId, setItemId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0])
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (itemsLoading || locationsLoading) return <Spinner className="h-96" size="lg" />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('Please describe the issue')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await staffService.reportIssue({
        itemId: itemId ? Number(itemId) : undefined,
        locationId: locationId ? Number(locationId) : undefined,
        issueType,
        quantity: quantity ? Number(quantity) : undefined,
        description,
      })
      setSubmitted(true)
      setDescription('')
      setQuantity('')
      toast.success(response.message)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to report issue'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Report Issues"
        subtitle="Log damaged, missing, or incomplete stock issues for follow-up"
      />

      {submitted && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-700">Issue was logged and is ready for review.</p>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Issue Report Form</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Issue Type *</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {ISSUE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Item</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Optional item --</option>
              {items?.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Optional location --</option>
              {locations?.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Affected Quantity"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Optional quantity"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, what was found, and what needs follow-up"
              className="min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>Submit Issue</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
