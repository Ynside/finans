'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, DollarSign, Wallet, Download, AlertTriangle, Receipt } from 'lucide-react'
import { loadData, saveData, resetData } from '@/lib/storage'
import { formatPara, parseTutar } from '@/lib/utils'
import { maasKontrolEt, ekGelirKontrolEt, sabitGiderKontrolEt } from '@/lib/finansal'
import type { FinansalVeriler, EkGelir, SabitGider } from '@/types'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { YedeklemeModal } from '@/components/modals/YedeklemeModal'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'

export default function AyarlarPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [maasTutar, setMaasTutar] = useState('')
  const [maasGun, setMaasGun] = useState('1')
  const [ekGelirModalOpen, setEkGelirModalOpen] = useState(false)
  const [sabitGiderModalOpen, setSabitGiderModalOpen] = useState(false)
  const [yedeklemeModalOpen, setYedeklemeModalOpen] = useState(false)
  const [sifirlama, setSifirlama] = useState<'idle' | 'countdown' | 'confirm'>('idle')
  const [geriSayim, setGeriSayim] = useState(5)

  useEffect(() => {
    const data = loadData()
    const { veriler: gelirVeriler } = ekGelirKontrolEt(data)
    const { veriler: yeniVeriler } = sabitGiderKontrolEt(gelirVeriler)
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

  const handleSifirlaBaslat = () => {
    setSifirlama('countdown')
    setGeriSayim(5)
    const interval = setInterval(() => {
      setGeriSayim((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setSifirlama('confirm')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSifirlaOnayla = () => {
    resetData()
    setSifirlama('idle')
    setGeriSayim(5)
    const data = loadData()
    setVeriler(data)
    setMaasTutar('0')
    setMaasGun('1')
  }

  const handleSifirlaIptal = () => {
    setSifirlama('idle')
    setGeriSayim(5)
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

  const handleSabitGiderDelete = (id: number) => {
    if (!confirm('Bu sabit gideri silmek istediğinize emin misiniz?')) return

    const yeniVeriler: FinansalVeriler = {
      ...veriler!,
      sabit_giderler: veriler!.sabit_giderler?.filter((sg) => sg.id !== id) || [],
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

          {/* Sabit Giderler */}
          <Card className="premium-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-orange-500/20">
                  <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Sabit Giderler</h2>
                  <p className="text-[10px] sm:text-xs text-white/60">Aylık tekrarlayan giderleriniz</p>
                </div>
              </div>
              <Button onClick={() => setSabitGiderModalOpen(true)} variant="primary" size="sm" className="text-xs sm:text-sm">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                Ekle
              </Button>
            </div>

            {veriler.sabit_giderler && veriler.sabit_giderler.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {veriler.sabit_giderler.map((sg) => {
                  const kart = veriler.kredi_kartlari?.find((kk) => kk.id === sg.kredi_karti_id)
                  return (
                    <div key={sg.id} className="glass rounded-lg p-3 sm:p-4 border border-white/10 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1 truncate">{sg.aciklama}</p>
                        <p className="text-xs sm:text-sm text-white/60">
                          {formatPara(sg.tutar)} • Her ayın {sg.gun}. günü •{' '}
                          <span className={sg.tip === 'nakit' ? 'text-blue-400' : 'text-orange-400'}>
                            {sg.tip === 'nakit' ? 'Nakit' : kart ? kart.ad : 'Kredi Kartı'}
                          </span>
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSabitGiderDelete(sg.id)}
                        variant="ghost"
                        size="sm"
                        className="ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                </div>
                <p className="text-white/60 text-xs sm:text-sm">Henüz sabit gider eklenmemiş</p>
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

          {/* Tehlikeli Bölge */}
          <Card className="premium-card lg:col-span-2 p-4 sm:p-6 border border-red-500/30">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-red-400">Tehlikeli Bölge</h2>
                <p className="text-[10px] sm:text-xs text-white/60">Bu işlemler geri alınamaz</p>
              </div>
            </div>

            {sifirlama === 'idle' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass rounded-lg p-3 sm:p-4 border border-red-500/20">
                <div>
                  <p className="text-sm font-semibold text-white">Tüm Verileri Sıfırla</p>
                  <p className="text-xs text-white/50 mt-0.5">Tüm borçlar, harcamalar, bakiye ve ayarlar silinir</p>
                </div>
                <Button
                  onClick={handleSifirlaBaslat}
                  variant="ghost"
                  className="text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs sm:text-sm w-full sm:w-auto flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Sıfırla
                </Button>
              </div>
            )}

            {sifirlama === 'countdown' && (
              <div className="glass rounded-lg p-3 sm:p-4 border border-red-500/30 text-center">
                <p className="text-sm text-white/70 mb-2">Sıfırlama başlatılıyor...</p>
                <div className="text-4xl font-bold text-red-400 mb-2">{geriSayim}</div>
                <p className="text-xs text-white/50 mb-3">İptal etmek için aşağıdaki butona tıklayın</p>
                <Button
                  onClick={handleSifirlaIptal}
                  variant="secondary"
                  className="text-xs sm:text-sm"
                >
                  İptal
                </Button>
              </div>
            )}

            {sifirlama === 'confirm' && (
              <div className="glass rounded-lg p-3 sm:p-4 border border-red-500/40">
                <p className="text-sm font-semibold text-red-400 mb-1">Son onay</p>
                <p className="text-xs text-white/60 mb-4">
                  Tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSifirlaIptal}
                    variant="secondary"
                    className="flex-1 text-xs sm:text-sm"
                  >
                    Vazgeç
                  </Button>
                  <Button
                    onClick={handleSifirlaOnayla}
                    variant="ghost"
                    className="flex-1 text-xs sm:text-sm text-red-400 hover:bg-red-500/20 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Evet, Sıfırla
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <YedeklemeModal
        isOpen={yedeklemeModalOpen}
        onClose={() => setYedeklemeModalOpen(false)}
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

      <SabitGiderEkleModal
        isOpen={sabitGiderModalOpen}
        onClose={() => setSabitGiderModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => {
          saveData(yeniVeriler)
          setVeriler(yeniVeriler)
          setSabitGiderModalOpen(false)
        }}
      />

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

function SabitGiderEkleModal({
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
  const [gun, setGun] = useState('1')
  const [tip, setTip] = useState<'nakit' | 'kredi_karti'>('nakit')
  const [krediKartiId, setKrediKartiId] = useState<string>('')

  const kartlar = veriler.kredi_kartlari || []

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

    if (tip === 'kredi_karti' && !krediKartiId) {
      alert('Lütfen bir kredi kartı seçin!')
      return
    }

    const yeniId = Math.max(...(veriler.sabit_giderler?.map((sg) => sg.id) || [0]), 0) + 1

    const yeniGider: SabitGider = {
      id: yeniId,
      aciklama: aciklama.trim(),
      tutar: parsedTutar,
      gun: parsedGun,
      tip,
      kredi_karti_id: tip === 'kredi_karti' ? parseInt(krediKartiId) : undefined,
      son_islem_tarihi: null,
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      sabit_giderler: [...(veriler.sabit_giderler || []), yeniGider],
    }

    onSave(yeniVeriler)
    setAciklama('')
    setTutar('')
    setGun('1')
    setTip('nakit')
    setKrediKartiId('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔁 Sabit Gider Ekle" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Açıklama"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Netflix, Spotify, Kira"
          required
        />
        <Input
          label="Tutar (TL)"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="200"
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

        <div>
          <label className="block text-sm font-semibold text-white/80 mb-2">Ödeme Yöntemi</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTip('nakit')}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                tip === 'nakit'
                  ? 'bg-blue-500/20 border-blue-500/60 text-blue-400'
                  : 'glass border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              Nakit / Banka
            </button>
            <button
              type="button"
              onClick={() => setTip('kredi_karti')}
              className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                tip === 'kredi_karti'
                  ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                  : 'glass border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              Kredi Kartı
            </button>
          </div>
        </div>

        {tip === 'kredi_karti' && kartlar.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Hangi Kart?</label>
            <select
              value={krediKartiId}
              onChange={(e) => setKrediKartiId(e.target.value)}
              className="w-full px-4 py-3 glass border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              required
            >
              <option value="" className="bg-gray-900">Kart seçin...</option>
              {kartlar.map((kk) => (
                <option key={kk.id} value={kk.id} className="bg-gray-900">{kk.ad}</option>
              ))}
            </select>
          </div>
        )}

        {tip === 'kredi_karti' && kartlar.length === 0 && (
          <div className="glass rounded-lg p-3 border border-orange-500/20">
            <p className="text-xs text-orange-400">Henüz kredi kartı eklenmemiş. Önce Kartlar sayfasından kart ekleyin.</p>
          </div>
        )}

        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-xs text-white/50">
            {tip === 'nakit'
              ? '💡 Her ayın belirtilen gününde nakit bakiyenizden otomatik düşülür.'
              : '💡 Her ayın belirtilen gününde seçili kartın dönem içi harcamasına eklenir.'}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
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
