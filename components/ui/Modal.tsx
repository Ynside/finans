'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className={cn(
            'glass-strong rounded-xl sm:rounded-2xl shadow-premium w-full animate-scale-in',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate flex-1 mr-2">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              aria-label="Kapat"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-5 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

