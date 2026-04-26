import { useState } from 'react'
import { Plus, Trash2, MapPin, Pencil } from 'lucide-react'
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

const emptyForm: CreateLocationPayload = {
  name: '',
  zone: '',
  rack: '',
  bin: '',
  capacity: undefined
}

export function LocationsPage() {
  const { data: locations, isLoading, refetch } = useApi(() => adminService.getLocations())

  const [showModal, setShowModal] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<CreateLocationPayload>(emptyForm)
  const [errors, setErrors] = useState({ zone: '', rack: '', bin: '' })

  const openCreate = () => {
    setEditLocation(null)
    setForm(emptyForm)
    setErrors({ zone: '', rack: '', bin: '' })
    setShowModal(true)
  }

  const openEdit = (location: Location) => {
    setEditLocation(location)
    setForm({
      name: location.name,
      zone: location.zone ?? '',
      rack: location.rack ?? '',
      bin: location.bin ?? '',
      capacity: location.capacity
    })
    setErrors({ zone: '', rack: '', bin: '' })
    setShowModal(true)
  }

  const validate = (): boolean => {
    const errs = { zone: '', rack: '', bin: '' }
    if (!form.name?.trim() && !form.zone?.trim() && !form.rack?.trim() && !form.bin?.trim()) {
      errs.zone = 'Provide custom name or zone/rack/bin fields'
    }
    setErrors(errs)
    return !errs.zone && !errs.rack && !errs.bin
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (editLocation) {
        await adminService.updateLocation(editLocation.id, form)
        toast.success('Location updated')
      } else {
        await adminService.createLocation(form)
        toast.success('Location created')
      }
      setShowModal(false)
      setForm(emptyForm)
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to save location'
      toast.error(msg)
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
      toast.error('Failed to delete - location may have stock')
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle={`${locations?.length ?? 0} warehouse locations`}
        action={
          <Button onClick={openCreate} leftIcon={<Plus />}>
            Add Location
          </Button>
        }
      />

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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(loc)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>Zone: <span className="font-medium text-gray-700">{loc.zone || '-'}</span></p>
                <p>Rack: <span className="font-medium text-gray-700">{loc.rack || '-'}</span></p>
                <p>Bin: <span className="font-medium text-gray-700">{loc.bin || '-'}</span></p>
                <p>Capacity: <span className="font-medium text-gray-700">{loc.capacity ?? 'Unlimited'}</span></p>
                <p>Created {new Date(loc.createdAt).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editLocation ? 'Edit Location' : 'Add New Location'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Custom Name (optional)"
            placeholder="e.g. A-01-BIN-4"
            value={form.name ?? ''}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Zone"
              placeholder="A"
              value={form.zone ?? ''}
              onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
              error={errors.zone}
            />
            <Input
              label="Rack"
              placeholder="01"
              value={form.rack ?? ''}
              onChange={e => setForm(f => ({ ...f, rack: e.target.value }))}
              error={errors.rack}
            />
            <Input
              label="Bin"
              placeholder="B4"
              value={form.bin ?? ''}
              onChange={e => setForm(f => ({ ...f, bin: e.target.value }))}
              error={errors.bin}
            />
          </div>
          <Input
            label="Capacity (optional)"
            type="number"
            min={1}
            placeholder="Leave blank for unlimited"
            value={form.capacity ?? ''}
            onChange={e => setForm(f => ({
              ...f,
              capacity: e.target.value ? Number(e.target.value) : undefined
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editLocation ? 'Save Changes' : 'Create Location'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
