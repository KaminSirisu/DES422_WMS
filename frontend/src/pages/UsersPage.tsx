// ============================================================
// USERS PAGE (Admin only)
// GET /admin/users — ดูรายชื่อ users ทั้งหมด
// ============================================================

import { Users } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'
import { getRoleBadge } from '../components/ui/Badge'

export function UsersPage() {
  const { data: users, isLoading } = useApi(() => adminService.getUsers())

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users?.length ?? 0} registered users`}
      />

      <Card>
        {!users || users.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['ID', 'Username', 'Email', 'Role', 'Joined'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">#{user.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{user.email ?? '—'}</td>
                    <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary cards */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100">
              <Users className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{users?.length ?? 0}</p>
              <p className="text-xs text-gray-400">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {users?.filter(u => u.role === 'admin').length ?? 0}
              </p>
              <p className="text-xs text-gray-400">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {users?.filter(u => u.role === 'user').length ?? 0}
              </p>
              <p className="text-xs text-gray-400">Regular Users</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
