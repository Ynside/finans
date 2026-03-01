import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 sm:px-4 py-2.5 sm:py-3 glass border border-white/10 rounded-lg sm:rounded-xl',
            'text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:ring-2',
            'focus:ring-primary focus:border-primary/50 transition-all',
            'hover:border-white/20 hover:bg-white/5',
            error && 'border-danger focus:ring-danger',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-danger font-medium animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

