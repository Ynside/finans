'use client'

import { CreditCard } from 'lucide-react'
import { parse } from 'date-fns'
import { formatPara, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { YaklasanOdeme, FinansalVeriler } from '@/types'
import { saveData } from '@/lib/storage'

interface OdemeItemProps {
  odeme: YaklasanOdeme
  veriler: FinansalVeriler
  onUpdate: (veriler: FinansalVeriler) => void
}

export function OdemeItem({ odeme, veriler, onUpdate }: OdemeItemProps) {
  const fark = odeme.fark

  const getStatusColor = () => {
    if (fark < 0) return 'bg-gradient-to-r from-danger/20 to-red-500/20 border-danger/50 text-danger backdrop-blur-sm'
    if (fark <= 7) return 'bg-gradient-to-r from-warning/20 to-amber-500/20 border-warning/50 text-warning backdrop-blur-sm'
    return 'glass border-white/10 text-white'
  }

  const getStatusText = () => {
    if (fark < 0) return `⚠️ ${Math.abs(fark)} gün gecikme`
    if (fark <= 7) return `⏰ ${fark} gün kaldı`
    return `📌 ${fark} gün`
  }

  const handleOdeme = () => {
    if (!confirm(`${formatPara(odeme.tutar)} ödemek istediğinize emin misiniz?\n\n⚠️ Bu tutar nakit bakiyenizden düşülecektir.`)) {
      return
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye - odeme.tutar,
      borclar: veriler.borclar.map((borc) =>
        borc.id === odeme.borc.id
          ? {
              ...borc,
              taksitler: borc.taksitler.map((t, idx) =>
                idx === odeme.taksit_index ? { ...t, odendi: true } : t
              ),
            }
          : borc
      ),
      odeme_gecmisi: [
        ...veriler.odeme_gecmisi,
        {
          borc_id: odeme.borc.id,
          taksit_index: odeme.taksit_index,
          tutar: odeme.tutar,
          tarih: new Date().toLocaleString('tr-TR'),
        },
      ],
    }

    saveData(yeniVeriler)
    onUpdate(yeniVeriler)
  }

  const handleGeriAl = () => {
    if (!confirm(`Bu ödemeyi geri almak istediğinize emin misiniz?\n\n✅ ${formatPara(odeme.tutar)} nakit bakiyenize iade edilecek.`)) {
      return
    }

    const gecmis = veriler.odeme_gecmisi
    const sonOdeme = gecmis
      .slice()
      .reverse()
      .find(
        (g) => g.borc_id === odeme.borc.id && g.taksit_index === odeme.taksit_index
      )

    if (!sonOdeme) {
      alert('Ödeme geçmişi bulunamadı!')
      return
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye + sonOdeme.tutar,
      borclar: veriler.borclar.map((borc) =>
        borc.id === odeme.borc.id
          ? {
              ...borc,
              taksitler: borc.taksitler.map((t, idx) =>
                idx === odeme.taksit_index ? { ...t, odendi: false } : t
              ),
            }
          : borc
      ),
      odeme_gecmisi: gecmis.filter((g) => g !== sonOdeme),
    }

    saveData(yeniVeriler)
    onUpdate(yeniVeriler)
  }

  const odendiMi = veriler.odeme_gecmisi.some(
    (g) => g.borc_id === odeme.borc.id && g.taksit_index === odeme.taksit_index
  )

  return (
    <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all premium-card group">
      <div className="flex items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs text-white/60 font-medium">{odeme.vade_str}</span>
            <span className={cn(
              "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium",
              fark < 0 ? "bg-danger/20 text-danger" : fark <= 7 ? "bg-warning/20 text-warning" : "bg-white/10 text-white/60"
            )}>
              {getStatusText()}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white truncate">{odeme.aciklama}</p>
        </div>
        <span className="text-base sm:text-lg font-bold text-white whitespace-nowrap flex-shrink-0">
          {formatPara(odeme.tutar)}
        </span>
      </div>
      <div className="flex gap-2">
        {!odendiMi ? (
          <Button onClick={handleOdeme} variant="success" size="sm" className="flex-1 text-xs sm:text-sm py-2">
            Öde
          </Button>
        ) : (
          <Button onClick={handleGeriAl} variant="secondary" size="sm" className="flex-1 text-xs sm:text-sm py-2">
            Geri Al
          </Button>
        )}
      </div>
    </div>
  )
}

