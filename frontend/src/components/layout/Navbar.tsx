// ============================================================
// NAVBAR (Top bar)
// แสดง: search bar, notification bell, user menu
// ============================================================

import { useState } from 'react'
import { Search, Bell, LogOut, Menu, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getRoleBadge } from '../ui/Badge'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

interface NavbarProps {
  onMenuToggle: () => void
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-sm px-6">
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, SKU..."
            className="w-64 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700
                       placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none
                       focus:ring-2 focus:ring-brand-400/20 transition-all"
          />
        </div>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          {/* Badge จำนวน notification */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-gray-700
                       hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="sm:block text-left">
              <p className="text-xs font-medium text-gray-800 leading-none">
                {user?.username ?? 'User'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                ID #{user?.id}
              </p>

            </div>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1">
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-800">Signed in as</p>
                  <div className="mt-1">{getRoleBadge(user?.role || 'user')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
