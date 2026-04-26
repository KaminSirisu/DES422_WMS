import { useState } from 'react'
import { BarChart3, FileText } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui/index'

type ReportTab = 'stock' | 'movement' | 'orders' | 'audit'

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('stock')
  const { data: reports, isLoading } = useApi(() => adminService.getReports())

  if (isLoading) return <Spinner className="h-96" size="lg" />

  const rows = tab === 'stock'
    ? reports?.stock ?? []
    : tab === 'movement'
      ? reports?.movement ?? []
      : tab === 'orders'
        ? reports?.orders ?? []
        : reports?.audit ?? []

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Stock balance, movement history, order analytics, and audit feed"
      />

      <Card className="mb-5 p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { key: 'stock', label: 'Stock Report' },
            { key: 'movement', label: 'Movement Report' },
            { key: 'orders', label: 'Order Analytics' },
            { key: 'audit', label: 'Audit Feed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as ReportTab)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === key ? 'bg-brand-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {(rows?.length ?? 0) === 0 ? (
          <EmptyState message="No report data available" />
        ) : (
          <div className="max-h-[600px] overflow-auto">
            {tab === 'stock' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['SKU', 'Item', 'Category', 'Total Stock', 'Min Stock'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row: any) => (
                    <tr key={row.itemId} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{row.sku}</td>
                      <td className="px-5 py-3 text-xs font-medium text-gray-800">{row.itemName}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.category || '-'}</td>
                      <td className="px-5 py-3 text-xs text-gray-700">{row.totalStock}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{row.minStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'movement' && (
              <div className="divide-y divide-gray-50">
                {rows.map((row: any) => (
                  <div key={row.id} className="flex items-center justify-between px-5 py-3 text-xs">
                    <div>
                      <p className="font-medium text-gray-800">{row.itemName} ({row.sku})</p>
                      <p className="text-gray-500">{row.locationName} · {row.username || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-700">{row.action} x{row.quantity}</p>
                      <p className="text-gray-400">{new Date(row.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'orders' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Order', 'Status', 'Customer', 'Lines', 'Total Qty', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row: any) => (
                    <tr key={row.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">ORD-{String(row.id).padStart(4, '0')}</td>
                      <td className="px-5 py-3 text-xs text-gray-700">{row.status}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.username || '-'}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.lineCount}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{row.totalQty}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">{new Date(row.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'audit' && (
              <div className="divide-y divide-gray-50">
                {rows.map((row: any) => (
                  <div key={row.id} className="flex items-center justify-between px-5 py-3 text-xs">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-3.5 w-3.5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">{row.action}</p>
                        <p className="text-gray-500">{row.entityType} #{row.entityId || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right text-gray-500">
                      <p>{row.user?.username || '-'}</p>
                      <p>{new Date(row.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-600" />
            <p className="text-xs text-gray-500">Stock Rows</p>
          </div>
          <p className="mt-1 text-xl font-bold text-gray-900">{reports?.stock?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Movement Logs</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{reports?.movement?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Order Records</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{reports?.orders?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Audit Entries</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{reports?.audit?.length ?? 0}</p>
        </Card>
      </div>
    </div>
  )
}
