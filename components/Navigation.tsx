'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, TrendingUp, Calculator, Settings, BarChart3, Wallet } from 'lucide-react'
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

// Bottom tab bar shows only the most important 5 items on mobile
const mobileTabItems = [
  { href: '/', label: 'Ana Sayfa', icon: LayoutDashboard },
  { href: '/borclar', label: 'Borçlar', icon: CreditCard },
  { href: '/kartlar', label: 'Kartlar', icon: Wallet },
  { href: '/projeksiyon', label: 'Projeksiyon', icon: TrendingUp },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Top Navigation */}
      <nav
        className="glass-strong border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl hidden md:block"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 py-3 md:py-4">
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
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {mobileTabItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[10px] font-medium transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(99,102,241,0.8)]')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
