// ============================================================
// ADJUST INVENTORY PAGE (Admin Only)
// Admin manually adjusts stock with audit trail
// ============================================================

import { useState } from 'react'
import { Plus, Minus, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Button } from '../components/ui/Button'
import { Card, PageHeader, Spinner } from '../components/ui/index'

const ADJUSTMENT_REASONS = [
  'Count difference (inventory variance)',
  'Damaged goods',
  'Spoiled goods',
  'Return from order',
  'Manual correction',
  'System adjustment',
  'Testing purposes',
  'Other'
]

export function AdjustInventoryPage() {
  const { data: items, isLoading: itemsLoading } = useApi(() => adminService.getItems())
  const { data: locations, isLoading: locationsLoading } = useApi(() => adminService.getLocations())

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<number>(0)
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStock, setCurrentStock] = useState<number>(0)

  // Fetch stock when item+location selected
  const handleItemLocationChange = async (itemId: number, locationId: number) => {
    if (!itemId || !locationId) return
    try {
      const stock = await adminService.getItemLocations(itemId)
      const itemStock = stock.find(s => s.locationId === locationId)
      setCurrentStock(itemStock?.quantity || 0)
    } catch (err) {
      toast.error('Failed to load stock')
    }
  }

  const handleSelectItem = (itemId: number) => {
    setSelectedItemId(itemId)
    setQuantity(0)
    if (selectedLocationId) {
      handleItemLocationChange(itemId, selectedLocationId)
    }
  }

  const handleSelectLocation = (locationId: number) => {
    setSelectedLocationId(locationId)
    setQuantity(0)
    if (selectedItemId) {
      handleItemLocationChange(selectedItemId, locationId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedItemId || !selectedLocationId || !reason) {
      toast.error('Please fill all fields')
      return
    }

    if (quantity === 0) {
      toast.error('Adjustment quantity cannot be zero')
      return
    }

    if (currentStock + quantity < 0) {
      toast.error('Cannot adjust to negative quantity')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await adminService.adjustInventory(
        selectedItemId,
        selectedLocationId,
        quantity,
        reason
      )
      toast.success(`Stock adjusted: ${currentStock} → ${result.stock.newQuantity}`)

      // Reset form
      setSelectedItemId(null)
      setSelectedLocationId(null)
      setQuantity(0)
      setReason(ADJUSTMENT_REASONS[0])
      setCurrentStock(0)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to adjust inventory'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (itemsLoading || locationsLoading) return <Spinner className="h-96" size="lg" />

  const selectedItem = items?.find(i => i.id === selectedItemId)
  const selectedLocation = locations?.find(l => l.id === selectedLocationId)
  const newStock = currentStock + quantity

  return (
    <div>
      <PageHeader
        title="Inventory Adjustment"
        subtitle="Manually adjust stock levels with audit trail"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Select Item */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Item
                </label>
                <select
                  value={selectedItemId || ''}
                  onChange={(e) => handleSelectItem(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={!items || items.length === 0}
                >
                  <option value="">Select item...</option>
                  {items?.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Location
                </label>
                <select
                  value={selectedLocationId || ''}
                  onChange={(e) => handleSelectLocation(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={!locations || locations.length === 0}
                >
                  <option value="">Select location...</option>
                  {locations?.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock (Display) */}
              {selectedItem && selectedLocation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{currentStock}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedItem.name} @ {selectedLocation.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">After Adjustment</p>
                      <p className={`text-2xl font-bold ${
                        newStock >= currentStock ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        {newStock}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {newStock > currentStock ? '+' : ''}{quantity}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Adjustment Amount
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q - 1)}
                    className="flex-shrink-0 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    placeholder="Enter adjustment (+ or -)"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex-shrink-0 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Positive: add stock | Negative: remove stock
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Adjustment Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ADJUSTMENT_REASONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This will be recorded in the audit log
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!selectedItem || !selectedLocation || quantity === 0}
                className="w-full"
              >
                <FileText className="h-4 w-4" />
                Confirm Adjustment
              </Button>
            </form>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Adjustment Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Item</p>
                  <p className="font-medium text-gray-800">
                    {selectedItem?.name || 'Not selected'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-800">
                    {selectedLocation?.name || 'Not selected'}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-gray-500">Current Stock</p>
                  <p className="text-lg font-bold text-gray-900">{currentStock}</p>
                </div>

                <div>
                  <p className="text-gray-500">Change</p>
                  <p className={`text-lg font-bold ${
                    quantity > 0 ? 'text-emerald-600' : quantity < 0 ? 'text-orange-600' : 'text-gray-400'
                  }`}>
                    {quantity > 0 ? '+' : ''}{quantity}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3 bg-brand-50 rounded p-3">
                  <p className="text-gray-500">New Stock</p>
                  <p className="text-xl font-bold text-brand-600">{newStock}</p>
                </div>

                <div>
                  <p className="text-gray-500">Reason</p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {reason}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-700">
                ℹ️ All adjustments are logged for audit purposes
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
