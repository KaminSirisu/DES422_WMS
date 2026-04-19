// ============================================================
// SIDEBAR COMPONENT
// Dark sidebar พร้อม nav links, active state, admin-only items
// ============================================================

import { NavLink } from 'react-router'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  PackageOpen,
  ArrowDownToLine,
  ShoppingCart,
  ScrollText,
  Settings,
  Building2,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  section?: string
}

const NAV_ITEMS: NavItem[] = [
  // OVERVIEW
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, section: 'OVERVIEW' },
  // WAREHOUSE OPERATIONS
  { to: '/inbound',   label: 'Receiving',         icon: <ArrowDownToLine className="h-4 w-4" />, section: 'WAREHOUSE OPERATIONS', adminOnly: true },
  { to: '/items',     label: 'Inventory',          icon: <PackageOpen className="h-4 w-4" />,     section: 'WAREHOUSE OPERATIONS', adminOnly: true },
  { to: '/orders',    label: 'Picking & Shipping', icon: <ShoppingCart className="h-4 w-4" />,    section: 'WAREHOUSE OPERATIONS' },
  // MANAGEMENT
  { to: '/logs',      label: 'Activity Logs',      icon: <ScrollText className="h-4 w-4" />,      section: 'MANAGEMENT', adminOnly: true },
  { to: '/locations', label: 'Locations',          icon: <Building2 className="h-4 w-4" />,       section: 'MANAGEMENT', adminOnly: true },
  { to: '/users',     label: 'Users',              icon: <Users className="h-4 w-4" />,           section: 'MANAGEMENT', adminOnly: true },
  // SYSTEM
  { to: '/settings',  label: 'Settings',           icon: <Settings className="h-4 w-4" />,        section: 'SYSTEM' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAdmin } = useAuth()

  // กรอง nav items ตาม role
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  // จัดกลุ่มตาม section
  const sections = [...new Set(visibleItems.map(i => i.section))]

  return (
    <aside
      className={clsx(
        'flex flex-col bg-sidebar text-white transition-all duration-300 ease-in-out',
        'h-screen sticky top-0 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo area */}
      <div className={clsx(
        'flex items-center border-b border-white/10 px-4 py-5',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">CoreLink</p>
              <p className="text-[10px] text-white/50 mt-0.5">Warehouse</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={clsx(
            'rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {sections.map((section) => (
          <div key={section} className="mb-4">
            {/* Section header - ซ่อนเมื่อ collapsed */}
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {section}
              </p>
            )}
            {visibleItems
              .filter(item => item.section === section)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors mb-0.5',
                      isActive
                        ? 'bg-brand-500/20 text-brand-400 font-medium'
                        : 'text-white/60 hover:bg-white/5 hover:text-white',
                      collapsed && 'justify-center'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
