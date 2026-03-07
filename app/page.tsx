'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Calendar, Plus, ArrowUpRight, ArrowDownRight, CreditCard, DollarSign, FileText } from 'lucide-react'
import { loadData, saveData, isOnboardingDone, setOnboardingDone } from '@/lib/storage'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { hesaplaFinansalDurum, bildirimleriOlustur, yaklasanOdemeleriGetir, maasKontrolEt, ekGelirKontrolEt, sabitGiderKontrolEt } from '@/lib/finansal'
import { formatPara } from '@/lib/utils'
import type { FinansalVeriler, YaklasanOdeme } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NakitModal } from '@/components/modals/NakitModal'
import { BorcEkleModal } from '@/components/modals/BorcEkleModal'
import { HarcamaEkleModal } from '@/components/modals/HarcamaEkleModal'
import { OdemeItem } from '@/components/OdemeItem'
import { QuickStats } from '@/components/QuickStats'
import { RecentTransactions } from '@/components/RecentTransactions'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [onboardingAcik, setOnboardingAcik] = useState(false)
  const [nakitModalOpen, setNakitModalOpen] = useState(false)
  const [nakitIslemTipi, setNakitIslemTipi] = useState<'ekle' | 'cikar'>('ekle')
  const [borcModalOpen, setBorcModalOpen] = useState(false)
  const [harcamaModalOpen, setHarcamaModalOpen] = useState(false)

  useEffect(() => {
    // Onboarding kontrolü: flag yoksa ve veri de yoksa sihirbazı göster
    if (!isOnboardingDone()) {
      const data = loadData()
      const hasData =
        data.nakit_bakiye > 0 ||
        data.borclar.length > 0 ||
        data.maas.tutar > 0 ||
        (data.kredi_kartlari ?? []).length > 0
      if (hasData) {
        setOnboardingDone() // eski kullanıcı, flag'i set et
      } else {
        setOnboardingAcik(true)
        return
      }
    }

    const data = loadData()
    const { veriler: maasVeriler, maasEklendi } = maasKontrolEt(data)
    const { veriler: gelirVeriler, ekGelirEklendi } = ekGelirKontrolEt(maasVeriler)
    const { veriler: yeniVeriler } = sabitGiderKontrolEt(gelirVeriler)

    if (maasEklendi) {
      alert(`✅ ${formatPara(data.maas.tutar)} maaşınız eklendi!`)
    }

    if (ekGelirEklendi) {
      const eklenenToplam = (data.ek_gelirler || [])
        .filter((eg) => {
          const bugun = new Date()
          const sonEkleme = eg.son_ekleme_tarihi
          if (sonEkleme === null && bugun.getDate() >= eg.gun) return true
          try {
            const [yil, ay] = sonEkleme.split('-').map(Number)
            return (bugun.getFullYear() > yil || (bugun.getFullYear() === yil && bugun.getMonth() + 1 > ay)) && bugun.getDate() >= eg.gun
          } catch {
            return false
          }
        })
        .reduce((sum, eg) => sum + eg.tutar, 0)
      if (eklenenToplam > 0) {
        alert(`✅ ${formatPara(eklenenToplam)} ek gelir eklendi!`)
      }
    }

    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
  }, [])

  const handleOnboardingTamamla = (yeniVeriler: FinansalVeriler) => {
    saveData(yeniVeriler)
    setOnboardingDone()
    setOnboardingAcik(false)
    const { veriler: maasVeriler, maasEklendi } = maasKontrolEt(yeniVeriler)
    const { veriler: gelirVeriler } = ekGelirKontrolEt(maasVeriler)
    const { veriler: sonVeriler } = sabitGiderKontrolEt(gelirVeriler)
    if (maasEklendi) {
      alert(`✅ ${formatPara(yeniVeriler.maas.tutar)} maaşınız eklendi!`)
    }
    saveData(sonVeriler)
    setVeriler(sonVeriler)
  }

  if (onboardingAcik) {
    return <OnboardingWizard onTamamla={handleOnboardingTamamla} />
  }

  if (!veriler) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white/60 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  const durum = hesaplaFinansalDurum(veriler)
  const bildirimler = bildirimleriOlustur(veriler)
  const yaklasanOdemeler = yaklasanOdemeleriGetir(veriler, 30)

  const handleNakitEkle = (tutar: number) => {
    const yeniVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye + tutar,
    }
    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
    setNakitModalOpen(false)
  }

  const handleNakitCikar = (tutar: number) => {
    if (tutar > veriler.nakit_bakiye) {
      alert('Yetersiz bakiye!')
      return
    }
    const yeniVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye - tutar,
    }
    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
    setNakitModalOpen(false)
  }

  const handleHarcamaSil = (id: number) => {
    const harcama = veriler.harcamalar?.find((h) => h.id === id)
    if (!harcama) return

    let yeniVeriler: FinansalVeriler = {
      ...veriler,
      harcamalar: veriler.harcamalar?.filter((h) => h.id !== id),
    }

    if (harcama.tip === 'nakit') {
      yeniVeriler.nakit_bakiye = veriler.nakit_bakiye + harcama.tutar
    } else if (harcama.tip === 'kredi_karti' && harcama.kredi_karti_id) {
      yeniVeriler.kredi_kartlari = veriler.kredi_kartlari?.map((kk) => {
        if (kk.id !== harcama.kredi_karti_id) return kk
        let guncelKart = { ...kk }
        if (harcama.taksitlendirme) {
          // Taksitli: taksit_planlari'ndan harcama_id eşleşeni çıkar
          guncelKart.taksit_planlari = (kk.taksit_planlari || []).filter(
            (tp) => tp.harcama_id !== harcama.id
          )
        } else {
          // Taksitsiz: dönem içi harcamadan düş
          guncelKart.donem_ici_harcama = Math.max(0, (kk.donem_ici_harcama || 0) - harcama.tutar)
        }
        return { ...guncelKart, bakiye: hesaplaBakiye(guncelKart) }
      })
    }

    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
  }

  const handlePdfExport = () => {
    import('@/lib/pdf').then(({ exportToPDF }) => {
      exportToPDF(veriler)
    })
  }

  return (
    <div className="min-h-screen bg-bg pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Header - Mobil için kompakt */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-white/60">Mali durumunuza genel bir bakış</p>
        </div>

        {/* Kritik Bildirimler - Mobil için kompakt */}
        {bildirimler.filter((b) => b.tip === 'danger' || b.tip === 'warning').length > 0 && (
          <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
            {bildirimler
              .filter((b) => b.tip === 'danger' || b.tip === 'warning')
              .map((bildirim, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'glass rounded-lg sm:rounded-xl p-3 sm:p-4 border flex items-center gap-2 sm:gap-3',
                    bildirim.tip === 'danger'
                      ? 'border-danger/50 bg-danger/10 text-danger'
                      : 'border-warning/50 bg-warning/10 text-warning'
                  )}
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-medium flex-1">{bildirim.mesaj}</p>
                </div>
              ))}
          </div>
        )}

        {/* Ana Metrikler - Mobil için 2x2 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="premium-card glow group p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary-light">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Nakit</div>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">{formatPara(durum.nakit)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Mevcut bakiye</div>
          </Card>

          <Card className="premium-card group p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-danger to-red-500">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Borç</div>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-danger mb-0.5 sm:mb-1 truncate">{formatPara(durum.toplam_borc)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Toplam borç</div>
          </Card>

          <Card className={cn(
            "premium-card group p-3 sm:p-4",
            durum.net >= 0 ? "glow-success" : "glow-danger"
          )}>
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className={cn(
                "p-2 sm:p-3 rounded-lg sm:rounded-xl",
                durum.net >= 0
                  ? "bg-gradient-to-br from-success to-emerald-500"
                  : "bg-gradient-to-br from-danger to-red-500"
              )}>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Net</div>
            </div>
            <div className={cn(
              "text-lg sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 truncate",
              durum.net >= 0 ? "text-success" : "text-danger"
            )}>
              {formatPara(durum.net)}
            </div>
            <div className="text-[10px] sm:text-xs text-white/40">
              {durum.net >= 0 ? 'Pozitif' : 'Negatif'}
            </div>
          </Card>

          <Card className="premium-card group p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-warning to-amber-500">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Bu Ay</div>
            </div>
            <div className="text-lg sm:text-2xl md:text-3xl font-bold text-warning mb-0.5 sm:mb-1 truncate">{formatPara(durum.bu_ay_odeme)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Ödeme</div>
          </Card>
        </div>

        {/* Hızlı İstatistikler - Mobil için kompakt */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <QuickStats veriler={veriler} />
        </div>

        {/* Hızlı Aksiyonlar - Mobil için grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
          <Button
            onClick={() => {
              setNakitIslemTipi('ekle')
              setNakitModalOpen(true)
            }}
            variant="success"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-3"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nakit Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </Button>
          <Button
            onClick={() => {
              setNakitIslemTipi('cikar')
              setNakitModalOpen(true)
            }}
            variant="danger"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-3"
          >
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Nakit Çıkar</span>
            <span className="sm:hidden">Çıkar</span>
          </Button>
          <Button
            onClick={() => setHarcamaModalOpen(true)}
            variant="primary"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-3"
          >
            <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Harcama</span>
            <span className="sm:hidden">Harcama</span>
          </Button>
          <Button
            onClick={() => setBorcModalOpen(true)}
            variant="primary"
            className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-3"
          >
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Borç Ekle</span>
            <span className="sm:hidden">Borç</span>
          </Button>
          <Button
            onClick={handlePdfExport}
            variant="secondary"
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 sm:py-3"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>PDF Rapor</span>
          </Button>
        </div>

        {/* İçerik Grid - Mobil için tek sütun */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Yaklaşan Ödemeler */}
          <div className="lg:col-span-2">
            <Card className="premium-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Yaklaşan Ödemeler</h2>
                    <p className="text-[10px] sm:text-xs text-white/60">Sonraki 30 gün</p>
                  </div>
                </div>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
                  {yaklasanOdemeler.length}
                </span>
              </div>
              {yaklasanOdemeler.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                  </div>
                  <p className="text-white/60 text-xs sm:text-sm">Yaklaşan ödeme yok</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {yaklasanOdemeler.slice(0, 5).map((odeme, idx) => (
                    <OdemeItem
                      key={idx}
                      odeme={odeme}
                      veriler={veriler}
                      onUpdate={(yeniVeriler) => {
                        saveData(yeniVeriler)
                        setVeriler(yeniVeriler)
                      }}
                    />
                  ))}
                  {yaklasanOdemeler.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-[10px] sm:text-xs text-white/40">
                        +{yaklasanOdemeler.length - 5} ödeme daha
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Özet Bilgiler */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="premium-card p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Kalan Bakiye</h3>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1">{formatPara(durum.kalan)}</div>
              <div className="text-[10px] sm:text-xs text-white/60">Bu ay sonrası</div>
            </Card>

            <RecentTransactions veriler={veriler} onHarcamaSil={handleHarcamaSil} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <NakitModal
        isOpen={nakitModalOpen}
        onClose={() => setNakitModalOpen(false)}
        tip={nakitIslemTipi}
        mevcutBakiye={durum.nakit}
        onSave={nakitIslemTipi === 'ekle' ? handleNakitEkle : handleNakitCikar}
      />

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

      <HarcamaEkleModal
        isOpen={harcamaModalOpen}
        onClose={() => setHarcamaModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => {
          saveData(yeniVeriler)
          setVeriler(yeniVeriler)
        }}
      />
    </div>
  )
}
