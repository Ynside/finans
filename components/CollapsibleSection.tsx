'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="glass rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-primary-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary-muted" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-4 border-t border-border animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

