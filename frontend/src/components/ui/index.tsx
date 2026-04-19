// ============================================================
// SPINNER
// ============================================================
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-brand-500 ${sizeMap[size]}`} />
    </div>
  )
}

// ============================================================
// STAT CARD - ใช้ใน Dashboard
// ============================================================
import type { ReactNode } from 'react'
import { clsx } from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBg?: string
  trend?: string       // เช่น "+12%" หรือ "-5%"
  trendUp?: boolean
  subtitle?: string
}

export function StatCard({ title, value, icon, iconBg = 'bg-brand-100', trend, trendUp, subtitle }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={clsx('rounded-xl p-3', iconBg)}>
          {icon}
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-semibold',
            trendUp ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-0.5 text-sm text-gray-500">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

// ============================================================
// CARD - generic card container
// ============================================================
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl bg-white border border-gray-100 shadow-sm', className)}>
      {children}
    </div>
  )
}

// ============================================================
// EMPTY STATE - แสดงเมื่อไม่มีข้อมูล
// ============================================================
export function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="mb-3 rounded-full bg-gray-100 p-4">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ============================================================
// PAGE HEADER
// ============================================================
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
