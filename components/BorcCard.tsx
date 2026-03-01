'use client'

import { useState } from 'react'
import { Trash2, List } from 'lucide-react'
import { formatPara } from '@/lib/utils'
import type { FinansalVeriler, Borc } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TaksitlerModal } from '@/components/modals/TaksitlerModal'

interface BorcCardProps {
  borc: Borc
  veriler: FinansalVeriler
  onUpdate: (veriler: FinansalVeriler) => void
  onDelete: (veriler: FinansalVeriler) => void
}

export function BorcCard({ borc, veriler, onUpdate, onDelete }: BorcCardProps) {
  const [taksitlerModalOpen, setTaksitlerModalOpen] = useState(false)

  const kalanTaksit = borc.taksitler.filter((t) => !t.odendi).length
  const kalanTutar = borc.taksitler
    .filter((t) => !t.odendi)
    .reduce((sum, t) => sum + t.tutar, 0)
  const toplamTaksit = borc.taksitler.length
  const odenenTaksit = toplamTaksit - kalanTaksit
  const oran = toplamTaksit > 0 ? (odenenTaksit / toplamTaksit) * 100 : 0

  const handleDelete = () => {
    const odenenSayi = borc.taksitler.filter((t) => t.odendi).length
    const odenenTutar = borc.taksitler
      .filter((t) => t.odendi)
      .reduce((sum, t) => sum + t.tutar, 0)

    let mesaj = `'${borc.aciklama}' borcunu silmek istediğinize emin misiniz?\n\n`
    if (odenenSayi > 0) {
      mesaj += `⚠️ DİKKAT: ${odenenSayi} taksit ödediniz (${formatPara(odenenTutar)})\n`
      mesaj += 'Bu borcu silerseniz ödediğiniz para GERİ DÖNMEZ!'
    }

    if (confirm(mesaj)) {
      const yeniVeriler: FinansalVeriler = {
        ...veriler,
        borclar: veriler.borclar.filter((b) => b.id !== borc.id),
      }
      onDelete(yeniVeriler)
    }
  }

  return (
    <>
      <Card className="premium-card p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1.5 sm:mb-2 text-white truncate">{borc.aciklama}</h3>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 sm:gap-4 text-xs sm:text-sm">
                <span className="text-white/60">Toplam: <span className="text-white font-semibold">{formatPara(borc.toplam)}</span></span>
                <span className="text-white/60">Aylık: <span className="text-white font-semibold">{formatPara(borc.aylik)}</span></span>
                <span className="text-danger font-bold">Kalan: {formatPara(kalanTutar)}</span>
              </div>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-info font-semibold">
                {odenenTaksit}/{toplamTaksit} taksit ödendi (%{Math.round(oran)})
              </span>
            </div>
            <div className="w-full glass rounded-full h-2 sm:h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-success to-emerald-400 h-2 sm:h-3 rounded-full transition-all duration-500 shadow-glow"
                style={{ width: `${oran}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => setTaksitlerModalOpen(true)}
              variant="secondary"
              size="sm"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Taksitleri Göster
            </Button>
            <Button onClick={handleDelete} variant="danger" size="sm" className="flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto">
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Sil
            </Button>
          </div>
        </div>
      </Card>

      <TaksitlerModal
        isOpen={taksitlerModalOpen}
        onClose={() => setTaksitlerModalOpen(false)}
        borc={borc}
        veriler={veriler}
        onUpdate={(yeniVeriler) => {
          onUpdate(yeniVeriler)
          setTaksitlerModalOpen(false)
        }}
      />
    </>
  )
}

