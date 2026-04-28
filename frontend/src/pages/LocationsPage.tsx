import { useState } from 'react'
import { AlertTriangle, Plus, Trash2, MapPin, Pencil, Package, ChevronDown, ChevronUp, Search } from 'lucide-react'
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
import { useAuth } from '../context/AuthContext'

const emptyForm: CreateLocationPayload = {
  name: '',
  zone: '',
  rack: '',
  bin: '',
  capacity: undefined
}

export function LocationsPage() {
  const { isAdmin } = useAuth()
  const { data: locations, isLoading, refetch } = useApi(() => adminService.getLocations())

  const [showModal, setShowModal] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set())
  const [searchFilters, setSearchFilters] = useState<Record<number, string>>({})
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

  const toggleExpand = (locationId: number) => {
    const newExpanded = new Set(expandedLocations)
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId)
    } else {
      newExpanded.add(locationId)
    }
    setExpandedLocations(newExpanded)
  }

  const getFilteredItems = (locationId: number, items: any[]) => {
    const searchQuery = (searchFilters[locationId] || '').toLowerCase()
    if (!searchQuery) return items

    return items.filter(entry => {
      const itemName = (entry.item?.name || '').toLowerCase()
      const itemSku = (entry.item?.sku || '').toLowerCase()
      return itemName.includes(searchQuery) || itemSku.includes(searchQuery)
    })
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle={`${locations?.length ?? 0} warehouse locations`}
        action={
          isAdmin ? (
            <Button onClick={openCreate} leftIcon={<Plus />}>
              Add Location
            </Button>
          ) : undefined
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
                {isAdmin && (
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
                )}
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Location Stock</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{loc.currentStock ?? 0}</p>
                    <p className="text-[11px] text-gray-400">
                      {loc.capacity ? `Capacity ${loc.capacity}` : 'Unlimited capacity'}
                    </p>
                  </div>
                  {loc.isFull ? (
                    <div className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Full
                    </div>
                  ) : loc.isAlmostFull ? (
                    <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      Almost full
                    </div>
                  ) : (
                    <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      Normal
                    </div>
                  )}
                </div>

                {loc.capacity ? (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Used</span>
                      <span>{loc.utilizationPercent ?? 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${(loc.utilizationPercent ?? 0) >= 100 ? 'bg-red-500' : (loc.utilizationPercent ?? 0) >= 80 ? 'bg-amber-500' : 'bg-brand-500'}`}
                        style={{ width: `${Math.min(100, loc.utilizationPercent ?? 0)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p>Zone: <span className="font-medium text-gray-700">{loc.zone || '-'}</span></p>
                <p>Rack: <span className="font-medium text-gray-700">{loc.rack || '-'}</span></p>
                <p>Bin: <span className="font-medium text-gray-700">{loc.bin || '-'}</span></p>
                <p>Capacity: <span className="font-medium text-gray-700">{loc.capacity ?? 'Unlimited'}</span></p>
                <p>Created {new Date(loc.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Items In Location ({loc.items?.length ?? 0})
                  </p>
                </div>

                {!loc.items || loc.items.length === 0 ? (
                  <p className="text-xs text-gray-400">No stock stored in this location</p>
                ) : (
                  <>
                    {/* Search filter */}
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchFilters[loc.id] || ''}
                        onChange={(e) => setSearchFilters({ ...searchFilters, [loc.id]: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs
                                   placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    {/* Scrollable items container */}
                    <div className="relative">
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-2">
                        {(() => {
                          const filteredItems = getFilteredItems(loc.id, loc.items)
                          
                          if (filteredItems.length === 0) {
                            return <p className="text-xs text-gray-400 py-2">No items match your search</p>
                          }

                          return filteredItems.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-50 to-white px-3 py-2 text-xs border border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-gray-800">{entry.item?.name ?? `Item #${entry.itemId}`}</p>
                                <p className="truncate text-xs text-gray-400">{entry.item?.sku ?? '-'}</p>
                              </div>
                              <div className="ml-2 flex-shrink-0 text-right">
                                <span className="inline-block rounded-lg bg-brand-100 px-2 py-1 font-mono font-semibold text-brand-700">x{entry.quantity}</span>
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                      
                      {/* Scrollbar indicator */}
                      {(loc.items?.length ?? 0) > 8 && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full opacity-30"></div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
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
      )}
    </div>
  )
}
