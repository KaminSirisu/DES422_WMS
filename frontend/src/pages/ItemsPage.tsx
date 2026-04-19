// ============================================================
// ITEMS PAGE (Admin only)
// CRUD: GET items, POST item, PUT item, DELETE item
// ============================================================

import { useState } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import type { CreateItemPayload } from '../services/admin.service'
import type { Item } from '../types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'

export function ItemsPage() {
  // ── Fetch all items ──────────────────────────────────────
  const { data: items, isLoading, refetch } = useApi(() => adminService.getItems())

  // ── Modal state ───────────────────────────────────────
  const [showModal, setShowModal]     = useState(false)
  const [editItem, setEditItem]       = useState<Item | null>(null)  // null = create mode
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Form state ────────────────────────────────────────
  const [form, setForm] = useState<CreateItemPayload>({ name: '', minStock: 10 })
  const [formErrors, setFormErrors] = useState({ name: '', minStock: '' })

  // ── Open modal ────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', minStock: 10 })
    setFormErrors({ name: '', minStock: '' })
    setShowModal(true)
  }

  const openEdit = (item: Item) => {
    setEditItem(item)
    setForm({ name: item.name, minStock: item.minStock })
    setFormErrors({ name: '', minStock: '' })
    setShowModal(true)
  }

  // ── Validate ─────────────────────────────────────────
  const validate = (): boolean => {
    const errs = { name: '', minStock: '' }
    if (!form.name.trim())   errs.name = 'Name is required'
    if (form.minStock < 0)   errs.minStock = 'Min stock must be ≥ 0'
    setFormErrors(errs)
    return !errs.name && !errs.minStock
  }

  // ── Submit (create or update) ─────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      if (editItem) {
        await adminService.updateItem(editItem.id, form)
        toast.success('Item updated successfully')
      } else {
        await adminService.createItem(form)
        toast.success('Item created successfully')
      }
      setShowModal(false)
      refetch()  // reload list
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Operation failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (item: Item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    try {
      await adminService.deleteItem(item.id)
      toast.success('Item deleted')
      refetch()
    } catch {
      toast.error('Failed to delete item')
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${items?.length ?? 0} items total`}
        action={
          <Button onClick={openCreate} leftIcon={<Plus />}>
            Add Item
          </Button>
        }
      />

      <Card>
        {!items || items.length === 0 ? (
          <EmptyState message="No items found. Create your first item." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Min Stock</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">#{item.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100">
                          <Package className="h-3.5 w-3.5 text-brand-600" />
                        </div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Min: {item.minStock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Item' : 'Add New Item'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g. NVIDIA RTX 4090 24GB"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            autoFocus
          />
          <Input
            label="Minimum Stock Alert"
            type="number"
            min={0}
            placeholder="10"
            value={form.minStock}
            onChange={(e) => setForm(f => ({ ...f, minStock: Number(e.target.value) }))}
            error={formErrors.minStock}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
