'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2, DollarSign, Settings, Wallet, Download } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { formatPara, parseTutar } from '@/lib/utils'
import { maasKontrolEt, ekGelirKontrolEt } from '@/lib/finansal'
import type { FinansalVeriler, EkGelir, KrediKarti } from '@/types'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { KrediKartiEkleModal } from '@/components/modals/KrediKartiEkleModal'
import { KrediKartiOdemeModal } from '@/components/modals/KrediKartiOdemeModal'
import { YedeklemeModal } from '@/components/modals/YedeklemeModal'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'

export default function AyarlarPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [maasTutar, setMaasTutar] = useState('')
  const [maasGun, setMaasGun] = useState('1')
  const [krediKartiModalOpen, setKrediKartiModalOpen] = useState(false)
  const [ekGelirModalOpen, setEkGelirModalOpen] = useState(false)
  const [odemeModalOpen, setOdemeModalOpen] = useState(false)
  const [yedeklemeModalOpen, setYedeklemeModalOpen] = useState(false)
  const [seciliKrediKarti, setSeciliKrediKarti] = useState<KrediKarti | null>(null)

  useEffect(() => {
    const data = loadData()
    const { veriler: yeniVeriler } = ekGelirKontrolEt(data)
    setVeriler(yeniVeriler)
    setMaasTutar(data.maas.tutar.toString())
    setMaasGun(data.maas.gun.toString())
  }, [])

  const handleMaasSave = () => {
    if (!veriler) return

    const tutar = parseFloat(maasTutar.replace(/\./g, '').replace(/,/g, '')) || 0
    const gun = parseInt(maasGun) || 1

    if (!(1 <= gun && gun <= 31)) {
      alert('Ödeme günü 1-31 arası olmalı!')
      return
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      maas: { tutar, gun },
    }

    const { veriler: kontrolVeriler, maasEklendi } = maasKontrolEt(yeniVeriler)
    
    if (maasEklendi && veriler.son_maas_tarihi === null && new Date().getDate() >= gun) {
      alert(
        `✅ Maaş ayarları kaydedildi!\n\n${formatPara(tutar)} her ayın ${gun}. günü eklenecek.\n\nBu ay maaş günü geçtiği için ${formatPara(tutar)} eklendi!`
      )
    } else {
      alert(`✅ Maaş ayarları kaydedildi!\n\n${formatPara(tutar)} her ayın ${gun}. günü otomatik eklenecek.`)
    }

    saveData(kontrolVeriler)
    setVeriler(kontrolVeriler)
  }

  const handleKrediKartiDelete = (id: number) => {
    if (!confirm('Bu kredi kartını silmek istediğinize emin misiniz? Tüm harcamaları da silinecektir.')) return
    
    const yeniVeriler: FinansalVeriler = {
      ...veriler!,
      kredi_kartlari: veriler!.kredi_kartlari?.filter((kk) => kk.id !== id) || [],
      harcamalar: veriler!.harcamalar?.filter((h) => !(h.tip === 'kredi_karti' && h.kredi_karti_id === id)) || [],
    }
    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
  }

  const handleEkGelirDelete = (id: number) => {
    if (!confirm('Bu ek geliri silmek istediğinize emin misiniz?')) return
    
    const yeniVeriler: FinansalVeriler = {
      ...veriler!,
      ek_gelirler: veriler!.ek_gelirler?.filter((eg) => eg.id !== id) || [],
    }
    saveData(yeniVeriler)
    setVeriler(yeniVeriler)
  }

  if (!veriler) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white/60 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
            Ayarlar
          </h1>
          <p className="text-xs sm:text-sm text-white/60">Uygulama ayarlarınızı yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Maaş Ayarları */}
          <Card className="premium-card p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Maaş Ayarları</h2>
            </div>
            
            <div className="glass rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-white/10">
              <p className="text-[10px] sm:text-xs text-white/60 mb-1">Mevcut Maaş</p>
              <p className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">{formatPara(veriler.maas.tutar)}</p>
              <p className="text-[10px] sm:text-xs text-white/60">
                Ödeme Günü: Her ayın {veriler.maas.gun}. günü
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <Input
                label="Maaş Tutarı (TL)"
                value={maasTutar}
                onChange={(e) => setMaasTutar(e.target.value)}
                placeholder="0"
                type="number"
              />
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">
                  Ödeme Günü (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={maasGun}
                  onChange={(e) => setMaasGun(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button onClick={handleMaasSave} variant="success" className="w-full">
                💾 Kaydet
              </Button>
              <p className="text-xs text-white/40 mt-2">
                ℹ️ Maaşınız her ay belirtilen günde otomatik olarak nakit bakiyenize eklenecektir.
              </p>
            </div>
          </Card>

          {/* Ek Gelirler */}
          <Card className="premium-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Ek Gelirler</h2>
                  <p className="text-[10px] sm:text-xs text-white/60">Aylık sabit ek gelirleriniz</p>
                </div>
              </div>
              <Button onClick={() => setEkGelirModalOpen(true)} variant="primary" size="sm" className="text-xs sm:text-sm">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                Ekle
              </Button>
            </div>

            {veriler.ek_gelirler && veriler.ek_gelirler.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {veriler.ek_gelirler.map((eg) => (
                  <div key={eg.id} className="glass rounded-lg p-3 sm:p-4 border border-white/10 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1 truncate">{eg.aciklama}</p>
                      <p className="text-xs sm:text-sm text-white/60">
                        {formatPara(eg.tutar)} • Her ayın {eg.gun}. günü
                      </p>
                    </div>
                    <Button
                      onClick={() => handleEkGelirDelete(eg.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                </div>
                <p className="text-white/60 text-xs sm:text-sm">Henüz ek gelir eklenmemiş</p>
              </div>
            )}
          </Card>

          {/* Kredi Kartları */}
          <Card className="premium-card lg:col-span-2 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-warning/20">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Kredi Kartları</h2>
                  <p className="text-[10px] sm:text-xs text-white/60">Kredi kartı bilgilerinizi yönetin</p>
                </div>
              </div>
              <Button onClick={() => setKrediKartiModalOpen(true)} variant="primary" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                Kart Ekle
              </Button>
            </div>

            {veriler.kredi_kartlari && veriler.kredi_kartlari.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {veriler.kredi_kartlari.map((kk) => (
                  <div key={kk.id} className="glass rounded-lg p-3 sm:p-4 border border-white/10">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-white mb-1 truncate">{kk.ad}</p>
                        <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-white/60">
                          <p>Ekstre: {kk.ekstre_kesim_gunu}. gün</p>
                          <p>Ödeme: {kk.son_odeme_gunu} gün sonra</p>
                          {kk.limit && (
                            <p>Limit: {formatPara(kk.limit)}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleKrediKartiDelete(kk.id)}
                        variant="ghost"
                        size="sm"
                        className="ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {kk.bakiye > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                          <p className="text-xs sm:text-sm text-warning font-semibold">
                            ⚠️ Ödenmemiş: {formatPara(kk.bakiye)}
                          </p>
                          <Button
                            onClick={() => {
                              setSeciliKrediKarti(kk)
                              setOdemeModalOpen(true)
                            }}
                            variant="success"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            💰 Öde
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                </div>
                <p className="text-white/60 text-xs sm:text-sm mb-2">Henüz kredi kartı eklenmemiş</p>
                <Button onClick={() => setKrediKartiModalOpen(true)} variant="primary" size="sm" className="text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                  İlk Kartınızı Ekleyin
                </Button>
              </div>
            )}
          </Card>

          {/* Veri Yedekleme */}
          <Card className="premium-card lg:col-span-2 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Veri Yedekleme</h2>
                <p className="text-[10px] sm:text-xs text-white/60">Verilerinizi yedekleyin veya geri yükleyin</p>
              </div>
            </div>
            <Button
              onClick={() => setYedeklemeModalOpen(true)}
              variant="secondary"
              className="w-full text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Download className="w-4 h-4 mr-2" />
              Yedekleme Yönetimi
            </Button>
          </Card>
        </div>
      </div>

      <YedeklemeModal
        isOpen={yedeklemeModalOpen}
        onClose={() => setYedeklemeModalOpen(false)}
      />

      <KrediKartiEkleModal
        isOpen={krediKartiModalOpen}
        onClose={() => setKrediKartiModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => {
          saveData(yeniVeriler)
          setVeriler(yeniVeriler)
          setKrediKartiModalOpen(false)
        }}
      />

      <EkGelirEkleModal
        isOpen={ekGelirModalOpen}
        onClose={() => setEkGelirModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => {
          saveData(yeniVeriler)
          setVeriler(yeniVeriler)
          setEkGelirModalOpen(false)
        }}
      />

      {seciliKrediKarti && (
        <KrediKartiOdemeModal
          isOpen={odemeModalOpen}
          onClose={() => {
            setOdemeModalOpen(false)
            setSeciliKrediKarti(null)
          }}
          krediKarti={seciliKrediKarti}
          veriler={veriler}
          onSave={(yeniVeriler) => {
            saveData(yeniVeriler)
            setVeriler(yeniVeriler)
            setOdemeModalOpen(false)
            setSeciliKrediKarti(null)
          }}
        />
      )}
    </div>
  )
}

function EkGelirEkleModal({
  isOpen,
  onClose,
  veriler,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
}) {
  const [aciklama, setAciklama] = useState('')
  const [tutar, setTutar] = useState('')
  const [gun, setGun] = useState('15')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedTutar = parseTutar(tutar)
    const parsedGun = parseInt(gun)

    if (!aciklama.trim() || parsedTutar <= 0) {
      alert('Lütfen geçerli bilgiler girin!')
      return
    }

    if (parsedGun < 1 || parsedGun > 31) {
      alert('Gün 1-31 arası olmalı!')
      return
    }

    const yeniId = Math.max(...(veriler.ek_gelirler?.map((eg) => eg.id) || [0]), 0) + 1

    const yeniEkGelir: EkGelir = {
      id: yeniId,
      aciklama: aciklama.trim(),
      tutar: parsedTutar,
      gun: parsedGun,
      son_ekleme_tarihi: null,
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      ek_gelirler: [...(veriler.ek_gelirler || []), yeniEkGelir],
    }

    onSave(yeniVeriler)
    setAciklama('')
    setTutar('')
    setGun('15')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💵 Ek Gelir Ekle" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Açıklama"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Kira Geliri"
          required
        />
        <Input
          label="Tutar (TL)"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="5000"
          type="number"
          required
        />
        <Input
          label="Ödeme Günü (1-31)"
          type="number"
          min="1"
          max="31"
          value={gun}
          onChange={(e) => setGun(e.target.value)}
          required
        />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            💾 Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  )
}
