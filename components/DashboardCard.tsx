import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  value: string
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info'
  icon?: ReactNode
}

export function DashboardCard({ 
  title, 
  value, 
  variant = 'primary', 
  icon
}: DashboardCardProps) {
  const colorMap = {
    primary: 'text-white',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  }

  return (
    <div className="glass rounded-lg p-5 border border-border premium-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-primary-muted">
              {icon}
            </div>
          )}
          <h3 className="text-xs font-medium text-primary-muted uppercase tracking-wider">
            {title}
          </h3>
        </div>
      </div>
      <p className={cn('text-2xl font-light tracking-tight', colorMap[variant])}>
        {value}
      </p>
    </div>
  )
}

