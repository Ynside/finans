'use client'

import { useEffect, useState } from 'react'
import { Plus, TrendingDown, AlertCircle } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { formatPara } from '@/lib/utils'
import { hesaplaFinansalDurum } from '@/lib/finansal'
import type { FinansalVeriler, Borc } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BorcEkleModal } from '@/components/modals/BorcEkleModal'
import { BorcCard } from '@/components/BorcCard'

export default function BorclarPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [borcModalOpen, setBorcModalOpen] = useState(false)

  useEffect(() => {
    setVeriler(loadData())
  }, [])

  if (!veriler) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white/60 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  const durum = hesaplaFinansalDurum(veriler)
  const toplamKalanTutar = veriler.borclar.reduce((toplam, borc) => {
    return (
      toplam +
      borc.taksitler
        .filter((t) => !t.odendi)
        .reduce((sum, t) => sum + t.tutar, 0)
    )
  }, 0)

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
            Borç Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-white/60">Tüm borçlarınızı tek yerden yönetin</p>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-danger/20">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Toplam Borç</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-danger mb-0.5 sm:mb-1 truncate">{formatPara(durum.toplam_borc)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Ödenmemiş borçlar</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-warning/20">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Bu Ay Ödeme</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-warning mb-0.5 sm:mb-1 truncate">{formatPara(durum.bu_ay_odeme)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Bu ay ödenecek</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Kalan Tutar</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-info mb-0.5 sm:mb-1 truncate">{formatPara(toplamKalanTutar)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Toplam kalan borç</div>
          </Card>
        </div>

        {/* Hızlı Aksiyon */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Button
            onClick={() => setBorcModalOpen(true)}
            variant="primary"
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Borç Ekle</span>
          </Button>
        </div>

        {/* Borçlar Listesi */}
        {veriler.borclar.length === 0 ? (
          <Card className="premium-card text-center py-16">
            <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-6 flex items-center justify-center">
              <TrendingDown className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-xl font-semibold text-white mb-2">Henüz borç eklenmemiş</p>
            <p className="text-white/60 mb-6">Yeni borç eklemek için yukarıdaki butona tıklayın</p>
            <Button onClick={() => setBorcModalOpen(true)} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              İlk Borcunuzu Ekleyin
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {veriler.borclar.map((borc, idx) => (
              <div key={borc.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <BorcCard
                  borc={borc}
                  veriler={veriler}
                  onUpdate={(yeniVeriler) => {
                    saveData(yeniVeriler)
                    setVeriler(yeniVeriler)
                  }}
                  onDelete={(yeniVeriler) => {
                    saveData(yeniVeriler)
                    setVeriler(yeniVeriler)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BorcEkleModal
        isOpen={borcModalOpen}
        onClose={() => setBorcModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => {
          saveData(yeniVeriler)
          setVeriler(yeniVeriler)
          setBorcModalOpen(false)
        }}
      />
    </div>
  )
}
