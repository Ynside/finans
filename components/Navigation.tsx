'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, TrendingUp, Calculator, Settings, BarChart3, Menu, X, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/borclar', label: 'Borçlar', icon: CreditCard },
  { href: '/kartlar', label: 'Kartlar', icon: Wallet },
  { href: '/projeksiyon', label: 'Projeksiyon', icon: TrendingUp },
  { href: '/analiz', label: 'Analiz', icon: BarChart3 },
  { href: '/kredi-simulasyon', label: 'Kredi', icon: Calculator },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav
      className="glass-strong border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 py-3 md:py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-lg text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="pb-4 space-y-1 animate-slide-in">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
