import { Users, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'
import { adminService } from '../services/admin.service'
import type { Role } from '../types'
import { Card, EmptyState, PageHeader } from '../components/ui/index'
import { Spinner } from '../components/ui/index'
import { getRoleBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const roles: Role[] = ['admin', 'staff', 'user']

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading, error, refetch } = useApi(() => adminService.getUsers())

  const handleRoleChange = async (userId: number, role: Role) => {
    try {
      await adminService.updateUserRole(userId, role)
      toast.success('Role updated')
      refetch()
    } catch (err: unknown) {
      const rawMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to update role'
      const msg = /enum|role/i.test(rawMsg)
        ? `${rawMsg}. Please run backend migration and restart server.`
        : rawMsg
      toast.error(msg)
    }
  }

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return
    try {
      await adminService.deleteUser(userId)
      toast.success('User deleted')
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to delete user'
      toast.error(msg)
    }
  }

  if (isLoading) return <Spinner className="h-96" size="lg" />

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users?.length ?? 0} registered users`}
        action={
          <Button variant="secondary" onClick={refetch} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <p className="text-sm font-medium text-gray-800">Account policy</p>
        <p className="mt-1 text-sm text-gray-500">
          Admin can review all registered users and manage their roles, but new accounts must be created through user registration, not by admin.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </Card>

      <Card>
        {!users || users.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['ID', 'Username', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
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
                    <td className="px-5 py-3 text-xs text-gray-500">{user.email ?? '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700"
                          disabled={user.id === currentUser?.id}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                        disabled={user.id === currentUser?.id}
                        title="Delete user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        {roles.map((role) => (
          <Card className="p-4" key={role}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                <Users className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {users?.filter(u => u.role === role).length ?? 0}
                </p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
