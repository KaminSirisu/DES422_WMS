// ============================================================
// NOT FOUND PAGE (404)
// ============================================================
import { useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-center p-8">
      <p className="text-8xl font-black text-gray-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-gray-700">Page not found</h1>
      <p className="mt-2 text-sm text-gray-400">
        The page you're looking for doesn't exist or you don't have access.
      </p>
      <Button
        className="mt-8"
        onClick={() => navigate('/dashboard')}
        leftIcon={<Home className="h-4 w-4" />}
      >
        Back to Dashboard
      </Button>
    </div>
  )
}

// ============================================================
// SETTINGS PAGE (placeholder)
// ============================================================
import { Settings } from 'lucide-react'
import { Card, PageHeader } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'
import { getRoleBadge } from '../components/ui/Badge'

export function SettingsPage() {
  const { user, isAdmin } = useAuth()
  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" subtitle="Account and system settings" />
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <Settings className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Account Info</p>
            <p className="text-xs text-gray-400">Your current session details</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2.5 border-b border-gray-50">
            <span className="text-gray-500">User ID</span>
            <span className="font-mono text-gray-700">#{user?.id}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-50">
            <span className="text-gray-500">Role</span>
            {getRoleBadge(user?.role ?? 'user')}
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-50">
            <span className="text-gray-500">Permissions</span>
            <span className="text-gray-700">{isAdmin ? 'Full access' : 'Read + Create orders'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-gray-500">API Base URL</span>
            <span className="font-mono text-xs text-gray-400">{import.meta.env.VITE_API_URL || '/api'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
