// ============================================================
// DASHBOARD LAYOUT
// Shell ที่ wrap ทุก page ใน protected area
// ประกอบด้วย: Sidebar + Navbar + main content area
// ============================================================

import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarCollapsed(c => !c)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Outlet = page component ที่ nested อยู่ใน Route */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
