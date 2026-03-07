'use client'

import { formatPara, cn } from '@/lib/utils'
import type { FinansalVeriler, Harcama } from '@/types'
import { ArrowDownRight, ArrowUpRight, CreditCard, Trash2 } from 'lucide-react'
import { Card } from './ui/Card'
import { format, parse } from 'date-fns'

interface RecentTransactionsProps {
  veriler: FinansalVeriler
  onHarcamaSil?: (id: number) => void
}

export function RecentTransactions({ veriler, onHarcamaSil }: RecentTransactionsProps) {
  const sonIslemler: Array<{
    type: 'harcama' | 'gelir'
    aciklama: string
    tutar: number
    tarih: string
    tip?: 'nakit' | 'kredi_karti'
    harcama_id?: number
  }> = []

  // Son harcamalar
  const sonHarcamalar = [...(veriler.harcamalar || [])]
    .sort((a, b) => {
      try {
        const tarihA = parse(a.tarih, 'dd.MM.yyyy HH:mm', new Date())
        const tarihB = parse(b.tarih, 'dd.MM.yyyy HH:mm', new Date())
        return tarihB.getTime() - tarihA.getTime()
      } catch {
        return 0
      }
    })
    .slice(0, 5)
    .map((h) => ({
      type: 'harcama' as const,
      aciklama: h.aciklama,
      tutar: h.tutar,
      tarih: h.tarih,
      tip: h.tip,
      harcama_id: h.id,
    }))

  sonIslemler.push(...sonHarcamalar)

  // Son ödemeler (odeme_gecmisi'nden)
  const sonOdemeler = [...(veriler.odeme_gecmisi || [])]
    .sort((a, b) => {
      try {
        const tarihA = new Date(a.tarih)
        const tarihB = new Date(b.tarih)
        return tarihB.getTime() - tarihA.getTime()
      } catch {
        return 0
      }
    })
    .slice(0, 3)
    .map((o) => {
      const borc = veriler.borclar.find((b) => b.id === o.borc_id)
      return {
        type: 'harcama' as const,
        aciklama: borc?.aciklama || 'Borç Ödemesi',
        tutar: o.tutar,
        tarih: o.tarih,
      }
    })

  sonIslemler.push(...sonOdemeler)

  // Tarihe göre sırala
  sonIslemler.sort((a, b) => {
    try {
      const tarihA = parse(a.tarih, 'dd.MM.yyyy HH:mm', new Date())
      const tarihB = parse(b.tarih, 'dd.MM.yyyy HH:mm', new Date())
      return tarihB.getTime() - tarihA.getTime()
    } catch {
      return 0
    }
  })

  const gosterilecekIslemler = sonIslemler.slice(0, 5)

  if (gosterilecekIslemler.length === 0) {
    return null
  }

  return (
    <Card className="premium-card p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white">Son İşlemler</h3>
          <p className="text-[10px] sm:text-xs text-white/60">En son yapılan işlemler</p>
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {gosterilecekIslemler.map((islem, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={cn(
                "p-1 sm:p-1.5 rounded-lg flex-shrink-0",
                islem.type === 'harcama' ? "bg-danger/20" : "bg-success/20"
              )}>
                {islem.type === 'harcama' ? (
                  <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-danger" />
                ) : (
                  <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate">{islem.aciklama}</p>
                <p className="text-[10px] sm:text-xs text-white/50 truncate">
                  {islem.tip === 'kredi_karti' && '💳 '}
                  {islem.tarih}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className={cn(
                "text-xs sm:text-sm font-semibold",
                islem.type === 'harcama' ? "text-danger" : "text-success"
              )}>
                {islem.type === 'harcama' ? '-' : '+'}
                {formatPara(islem.tutar)}
              </span>
              {islem.harcama_id != null && onHarcamaSil && (
                <button
                  onClick={() => {
                    if (confirm('Bu harcamayı silmek istediğinize emin misiniz?')) {
                      onHarcamaSil(islem.harcama_id!)
                    }
                  }}
                  className="p-1 rounded text-white/30 hover:text-danger hover:bg-danger/10 transition-all"
                  title="Sil"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

