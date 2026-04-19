// ============================================================
// LOCATIONS PAGE (Admin only)
// CRUD: GET /admin/locations, POST, DELETE
// ============================================================

import { useState } from 'react'
import { Plus, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import type { CreateLocationPayload } from '../services/admin.service'
import type { Location } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'

export function LocationsPage() {
  const { data: locations, isLoading, refetch } = useApi(() => adminService.getLocations())

  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<CreateLocationPayload>({ name: '', capacity: undefined })
  const [errors, setErrors] = useState({ name: '' })

  const validate = (): boolean => {
    const errs = { name: '' }
    if (!form.name.trim()) errs.name = 'Location name is required'
    setErrors(errs)
    return !errs.name
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await adminService.createLocation(form)
      toast.success('Location created')
      setShowModal(false)
      setForm({ name: '', capacity: undefined })
      refetch()
    } catch {
      toast.error('Failed to create location')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return
    try {
      await adminService.deleteLocation(loc.id)
      toast.success('Location deleted')
      refetch()
    } catch {
      toast.error('Failed to delete — location may have stock')
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle={`${locations?.length ?? 0} warehouse locations`}
        action={
          <Button onClick={() => setShowModal(true)} leftIcon={<Plus />}>
            Add Location
          </Button>
        }
      />

      {/* Location grid */}
      {!locations || locations.length === 0 ? (
        <Card><EmptyState message="No locations found. Add your first location." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                    <MapPin className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{loc.name}</p>
                    <p className="text-xs text-gray-400 font-mono">ID #{loc.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(loc)}
                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {loc.capacity != null ? (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Capacity</span>
                      <span className="font-medium">{loc.capacity} units</span>
                    </div>
                    {/* Capacity bar placeholder — real usage needs ItemLocation data */}
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-brand-400" style={{ width: '40%' }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No capacity limit</p>
                )}
                <p className="text-xs text-gray-400">
                  Created {new Date(loc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Location"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Location Name *"
            placeholder="e.g. A-01, Zone-B-Shelf-3"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
            autoFocus
          />
          <Input
            label="Capacity (optional)"
            type="number"
            min={1}
            placeholder="Leave blank for unlimited"
            value={form.capacity ?? ''}
            onChange={e => setForm(f => ({
              ...f,
              capacity: e.target.value ? Number(e.target.value) : undefined,
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
