import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95 font-semibold',
    success: 'bg-gradient-to-r from-success to-emerald-500 text-white hover:shadow-lg hover:shadow-success/50 hover:scale-105 active:scale-95 font-semibold',
    danger: 'bg-gradient-to-r from-danger to-red-500 text-white hover:shadow-lg hover:shadow-danger/50 hover:scale-105 active:scale-95 font-semibold',
    warning: 'bg-gradient-to-r from-warning to-amber-500 text-white hover:shadow-lg hover:shadow-warning/50 hover:scale-105 active:scale-95 font-semibold',
    info: 'bg-gradient-to-r from-info to-blue-500 text-white hover:shadow-lg hover:shadow-info/50 hover:scale-105 active:scale-95 font-semibold',
    secondary: 'glass text-white hover:bg-white/10 border border-white/15 hover:border-white/25 font-medium',
    ghost: 'text-white/70 hover:text-white hover:bg-white/10 font-medium',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
  }

  return (
    <button
      className={cn(
        'transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

