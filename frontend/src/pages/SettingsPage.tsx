import { useEffect, useState } from 'react'
import { Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui/index'

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useApi(() => adminService.getSettings())
  const { data: audits, isLoading: auditsLoading, refetch: refetchAudits } = useApi(() => adminService.getAuditLogs())

  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    defaultReorderPoint: '',
    lowStockBuffer: '',
    allocationStrategy: 'FIFO' as 'FIFO' | 'LIFO'
  })

  const isLoading = settingsLoading || auditsLoading

  useEffect(() => {
    if (settings) {
      setForm({
        defaultReorderPoint: String(settings.defaultReorderPoint),
        lowStockBuffer: String(settings.lowStockBuffer),
        allocationStrategy: settings.allocationStrategy
      })
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await adminService.updateSettings({
        defaultReorderPoint: Number(form.defaultReorderPoint),
        lowStockBuffer: Number(form.lowStockBuffer),
        allocationStrategy: form.allocationStrategy
      })
      toast.success('System rules updated')
      refetchSettings()
      refetchAudits()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to update settings'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="System Rules"
        subtitle="Configure reorder points, allocation strategy, and low-stock alert behavior"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-800">Inventory Rules</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Default Reorder Point</label>
              <input
                type="number"
                min={0}
                value={form.defaultReorderPoint}
                onChange={(e) => setForm(f => ({ ...f, defaultReorderPoint: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">Used as default min stock for newly created SKU</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Low Stock Alert Buffer</label>
              <input
                type="number"
                min={0}
                value={form.lowStockBuffer}
                onChange={(e) => setForm(f => ({ ...f, lowStockBuffer: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">Alert triggers when stock is below min stock + buffer</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Allocation Strategy</label>
              <select
                value={form.allocationStrategy}
                onChange={(e) => setForm(f => ({ ...f, allocationStrategy: e.target.value as 'FIFO' | 'LIFO' }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="FIFO">FIFO</option>
                <option value="LIFO">LIFO</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">Used for order stock allocation during picking</p>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
                Save Rules
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Audit Control</h2>
            </div>
            <p className="mt-1 text-xs text-gray-400">Who changed what and when</p>
          </div>
          {!audits || audits.length === 0 ? (
            <EmptyState message="No audit entries found" />
          ) : (
            <div className="max-h-[520px] overflow-auto divide-y divide-gray-50">
              {audits.slice(0, 80).map((audit) => (
                <div key={audit.id} className="flex items-center justify-between px-5 py-3 text-xs">
                  <div>
                    <p className="font-medium text-gray-800">{audit.action}</p>
                    <p className="text-gray-500">
                      {audit.entityType} #{audit.entityId || '-'} · {audit.user?.username || '-'}
                    </p>
                  </div>
                  <p className="text-gray-400">{new Date(audit.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
