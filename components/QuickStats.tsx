'use client'

import { formatPara } from '@/lib/utils'
import type { FinansalVeriler } from '@/types'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { Card } from './ui/Card'

interface QuickStatsProps {
  veriler: FinansalVeriler
}

export function QuickStats({ veriler }: QuickStatsProps) {
  const bugun = new Date()
  const son30Gun = new Date(bugun.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Son 30 gün harcamaları
  const son30GunHarcamalar = (veriler.harcamalar || []).filter((h) => {
    try {
      const [gun, ay, yil] = h.tarih.split('.')
      const harcamaTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
      return harcamaTarihi >= son30Gun && h.tip === 'nakit'
    } catch {
      return false
    }
  })

  const toplamHarcama = son30GunHarcamalar.reduce((sum, h) => sum + h.tutar, 0)
  const ortalamaGunluk = toplamHarcama / 30

  // Bu ay harcamaları
  const buAyHarcamalar = (veriler.harcamalar || []).filter((h) => {
    try {
      const [gun, ay, yil] = h.tarih.split('.')
      const harcamaTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
      return harcamaTarihi.getMonth() === bugun.getMonth() && 
             harcamaTarihi.getFullYear() === bugun.getFullYear() &&
             h.tip === 'nakit'
    } catch {
      return false
    }
  })

  const buAyToplam = buAyHarcamalar.reduce((sum, h) => sum + h.tutar, 0)

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="premium-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-danger" />
        </div>
        <div className="text-[10px] sm:text-xs text-white/60 mb-1">Bu Ay</div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{formatPara(buAyToplam)}</div>
      </Card>

      <Card className="premium-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-warning/20">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning" />
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-white/60 mb-1">30 Gün</div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{formatPara(toplamHarcama)}</div>
      </Card>

      <Card className="premium-card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-info" />
          </div>
        </div>
        <div className="text-[10px] sm:text-xs text-white/60 mb-1">Günlük</div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{formatPara(ortalamaGunluk)}</div>
      </Card>
    </div>
  )
}




