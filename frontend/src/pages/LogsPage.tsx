// ============================================================
// LOGS PAGE (Admin only)
// GET /logs?action=ADD&startDate=...&endDate=...
// ============================================================

import { useState } from 'react'
import { Filter, RefreshCw } from 'lucide-react'
import { logService } from '../services/log.service'
import type { LogFilters } from '../services/log.service'
import { useApi } from '../hooks/useApi'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'
import { Button } from '../components/ui/Button'
import { getLogActionBadge } from '../components/ui/Badge'
import type { LogAction } from '../types'

const ACTION_OPTIONS: { value: LogAction | ''; label: string }[] = [
  { value: '',            label: 'All Actions' },
  { value: 'ADD',         label: 'ADD (Inbound)' },
  { value: 'WITHDRAW',    label: 'WITHDRAW' },
  { value: 'TRANSFER_IN', label: 'TRANSFER IN' },
  { value: 'TRANSFER_OUT',label: 'TRANSFER OUT' },
]

export function LogsPage() {
  const [filters, setFilters] = useState<LogFilters>({})

  // filter inputs (local state ก่อน apply)
  const [actionInput, setActionInput]     = useState<LogAction | ''>('')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput]   = useState('')

  const { data: logs, isLoading, refetch } = useApi(() => logService.getAll(filters), [filters])

  // Apply filters
  const applyFilters = () => {
    setFilters({
      action:    actionInput || undefined,
      startDate: startDateInput || undefined,
      endDate:   endDateInput   || undefined,
    })
  }

  const clearFilters = () => {
    setActionInput('')
    setStartDateInput('')
    setEndDateInput('')
    setFilters({})
  }

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle={`${logs?.length ?? 0} records`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={refetch}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filters</span>
          </div>

          {/* Action filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Action</label>
            <select
              value={actionInput}
              onChange={e => setActionInput(e.target.value as LogAction | '')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800
                         focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {ACTION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={startDateInput}
              onChange={e => setStartDateInput(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={endDateInput}
              onChange={e => setEndDateInput(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <Spinner className="h-64" />
        ) : !logs || logs.length === 0 ? (
          <EmptyState message="No logs found for the selected filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['ID', 'Action', 'Item', 'Location', 'Qty', 'Reason', 'User', 'Time'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">#{log.id}</td>
                    <td className="px-5 py-3">{getLogActionBadge(log.action)}</td>
                    <td className="px-5 py-3 text-xs font-medium text-gray-700">
                      {log.item?.name ?? `#${log.itemId}`}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {log.location?.name ?? `#${log.locationId}`}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">
                      {log.action === 'ADD' ? '+' : '-'}{log.quantity}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {log.reason || '-'}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {log.user?.username ?? `#${log.userId}`}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
