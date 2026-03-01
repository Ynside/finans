import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Bildirim } from '@/types'

interface NotificationBannerProps {
  bildirim: Bildirim
}

export function NotificationBanner({ bildirim }: NotificationBannerProps) {
  const icons = {
    danger: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const variants = {
    danger: 'border-danger/30 text-danger bg-danger/5',
    warning: 'border-warning/30 text-warning bg-warning/5',
    success: 'border-success/30 text-success bg-success/5',
    info: 'border-info/30 text-info bg-info/5',
  }

  return (
    <div className={cn(
      'glass rounded-md p-3 flex items-center gap-2 border border-border animate-slide-in',
      variants[bildirim.tip]
    )}>
      {icons[bildirim.tip]}
      <p className="text-xs font-medium flex-1">{bildirim.mesaj}</p>
    </div>
  )
}

