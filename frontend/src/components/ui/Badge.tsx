// ============================================================
// BADGE COMPONENT
// ใช้แสดง status ต่างๆ เช่น OrderStatus, LogAction, Role
// ============================================================

import { clsx } from 'clsx'
import type { OrderStatus, LogAction, Role } from '../../types'

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'

interface BadgeProps {
  children: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-700',
  blue:   'bg-blue-100 text-blue-700',
  yellow: 'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantStyles[variant]
    )}>
      {children}
    </span>
  )
}

// ── Helper functions: map enum → variant ──────────────────

export function getOrderStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
    PENDING:    { variant: 'yellow', label: 'Pending' },
    PROCESSING: { variant: 'blue',   label: 'Processing' },
    COMPLETED:  { variant: 'green',  label: 'Completed' },
    CANCELLED:  { variant: 'red',    label: 'Cancelled' },
    BACKLOG:    { variant: 'orange', label: 'Backlog' },
  }
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function getLogActionBadge(action: LogAction) {
  const map: Record<LogAction, { variant: BadgeVariant; label: string }> = {
    ADD:          { variant: 'green',  label: 'ADD' },
    WITHDRAW:     { variant: 'red',    label: 'WITHDRAW' },
    TRANSFER_IN:  { variant: 'blue',   label: 'TRANSFER IN' },
    TRANSFER_OUT: { variant: 'purple', label: 'TRANSFER OUT' },
  }
  const { variant, label } = map[action]
  return <Badge variant={variant}>{label}</Badge>
}

export function getRoleBadge(role: Role) {
  return role === 'admin'
    ? <Badge variant="purple">Admin</Badge>
    : <Badge variant="gray">User</Badge>
}
