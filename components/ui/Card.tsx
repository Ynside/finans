import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'glass'
  hover?: boolean
}

export function Card({ children, className, variant = 'default', hover = true }: CardProps) {
  const variants = {
    default: 'glass',
    gradient: 'bg-gradient-to-br from-primary to-primary-light',
    glass: 'glass-strong',
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-6 border border-white/10',
        variants[variant],
        hover && 'premium-card',
        className
      )}
    >
      {children}
    </div>
  )
}

