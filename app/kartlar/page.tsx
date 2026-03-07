'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { formatPara } from '@/lib/utils'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import { format, addMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { FinansalVeriler, KrediKarti, TaksitPlani } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { KrediKartiEkleModal } from '@/components/modals/KrediKartiEkleModal'
import { KrediKartiOdemeModal } from '@/components/modals/KrediKartiOdemeModal'
import { TaksitEkleModal } from '@/components/modals/TaksitEkleModal'

function ayAdi(yyyyMM: string): string {
  try {
    const [yil, ay] = yyyyMM.split('-').map(Number)
    return format(new Date(yil, ay - 1, 1), 'MMMM yyyy', { locale: tr })
  } catch {
    return yyyyMM
  }
}

interface TaksitKalem {
  aciklama: string
  tutar: number
  taksitId: number
  tip: 'yeni' | 'eski'
  ayIdx: number
  taksitNo: number    // Bu ayın kaçıncı taksit olduğu (1-based)
  toplamTaksit: number
}

interface OdemeSatiri {
  ay: string
  ayAdi: string
  ekstreBorcu: number
  donemIci: number
  taksitler: TaksitKalem[]
  toplam: number
}

function odemeTakvimiHesapla(kk: KrediKarti): OdemeSatiri[] {
  const bugun = new Date()
  const satirlar: OdemeSatiri[] = []

  for (let offset = 0; offset < 12; offset++) {
    const hedef = addMonths(bugun, offset)
    const ay = format(hedef, 'yyyy-MM')
    const hedefStart = hedef.getFullYear() * 12 + hedef.getMonth()

    let ekstreBorcu = 0
    if (kk.donem_borcu && kk.donem_borcu > 0) {
      const bugunGun = bugun.getDate()
      // Ekstre BU ay kapandıysa (bugunGun >= ekstre_kesim_gunu) → son ödeme bu ay
      // Ekstre henüz kapanmadıysa (bugunGun < ekstre_kesim_gunu) → son ödeme geçen ay kapanan ekstre için bu ay
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun < kk.ekstre_kesim_gunu) {
        ekstreAy -= 1
        if (ekstreAy < 0) { ekstreAy = 11; ekstreYil -= 1 }
      }
      let ekstreTarihi = new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu)
      let odemeTarihi = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
      // Son ödeme geçtiyse (ödenmediyse) bir sonraki dönem ekstresiyle birleşir — bir ay ileri al
      if (odemeTarihi < bugun) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
        ekstreTarihi = new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu)
        odemeTarihi = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
      }
      if (format(odemeTarihi, 'yyyy-MM') === ay) {
        ekstreBorcu = kk.donem_borcu
      }
    }

    let donemIci = 0
    if (kk.donem_ici_harcama && kk.donem_ici_harcama > 0) {
      const bugunGun = bugun.getDate()
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun >= kk.ekstre_kesim_gunu) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
      }
      const ekstreTarihi = new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu)
      const odemeTarihi = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
      if (format(odemeTarihi, 'yyyy-MM') === ay) {
        donemIci = kk.donem_ici_harcama
      }
    }

    const taksitler: TaksitKalem[] = []
    if (kk.taksit_planlari !== undefined) {
      for (const tp of kk.taksit_planlari) {
        const [planYil, planAy] = tp.baslangic.split('-').map(Number)
        const planStart = planYil * 12 + planAy - 1
        const idx = hedefStart - planStart
        if (idx >= 0 && idx < tp.kalan_taksit) {
          const tutar = tp.aylik_odemeler?.[idx] ?? tp.aylik_tutar
          const odenmisTaksit = tp.toplam_taksit - tp.kalan_taksit
          taksitler.push({
            aciklama: tp.aciklama, tutar,
            taksitId: tp.id, tip: 'yeni', ayIdx: idx,
            taksitNo: odenmisTaksit + idx + 1,
            toplamTaksit: tp.toplam_taksit,
          })
        }
      }
    } else if (kk.odeme_plani) {
      const [planYil, planAy] = kk.odeme_plani.baslangic.split('-').map(Number)
      const planStart = planYil * 12 + planAy - 1
      const idx = hedefStart - planStart
      if (idx >= 0 && idx < kk.odeme_plani.aylar.length && kk.odeme_plani.aylar[idx] > 0) {
        taksitler.push({
          aciklama: 'Birleşik taksit planı', tutar: kk.odeme_plani.aylar[idx],
          taksitId: 0, tip: 'yeni', ayIdx: idx,
          taksitNo: idx + 1, toplamTaksit: kk.odeme_plani.aylar.length,
        })
      }
    }

    // Eski format: taksitler (KrediKartiTaksit[])
    for (const t of (kk.taksitler || [])) {
      try {
        const [gun, ayNo, yil] = t.sonraki_taksit_tarihi.split('.').map(Number)
        const ilkOdeme = new Date(yil, ayNo - 1, gun)
        const odenmisTaksit = t.toplam_taksit - t.kalan_taksit
        for (let i = 0; i < t.kalan_taksit; i++) {
          const odemeTarihi = addMonths(ilkOdeme, i)
          if (format(odemeTarihi, 'yyyy-MM') === ay) {
            taksitler.push({
              aciklama: t.aciklama, tutar: t.aylik_odemeler?.[i] ?? t.aylik_tutar,
              taksitId: t.id, tip: 'eski', ayIdx: i,
              taksitNo: odenmisTaksit + i + 1,
              toplamTaksit: t.toplam_taksit,
            })
          }
        }
      } catch { /* ignore */ }
    }

    const toplam = ekstreBorcu + donemIci + taksitler.reduce((s, t) => s + t.tutar, 0)
    if (toplam > 0) {
      satirlar.push({ ay, ayAdi: ayAdi(ay), ekstreBorcu, donemIci, taksitler, toplam })
    }
  }

  return satirlar
}

// ────────────────────────────────────────────────────────────────
// KART LİSTESİ
// ────────────────────────────────────────────────────────────────
function KartListesi({
  kartlar,
  onKartSec,
  onKartEkle,
}: {
  kartlar: KrediKarti[]
  onKartSec: (kart: KrediKarti) => void
  onKartEkle: () => void
}) {
  const toplamBorc = kartlar.reduce((s, kk) => s + kk.bakiye, 0)
  const toplamTaksit = kartlar.reduce((s, kk) => s + (kk.taksit_planlari?.length || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Kredi Kartları</h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">Kartlarınızı seçerek detay görün ve düzenleyin</p>
        </div>
        <Button onClick={onKartEkle} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Kart Ekle
        </Button>
      </div>

      {/* Özet */}
      {kartlar.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="premium-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Toplam Borç</p>
            <p className="text-base sm:text-xl font-bold text-danger">{formatPara(toplamBorc)}</p>
          </Card>
          <Card className="premium-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Kart Sayısı</p>
            <p className="text-base sm:text-xl font-bold text-white">{kartlar.length}</p>
          </Card>
          <Card className="premium-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-white/60 mb-1">Aktif Taksit</p>
            <p className="text-base sm:text-xl font-bold text-warning">{toplamTaksit}</p>
          </Card>
        </div>
      )}

      {/* Kart listesi */}
      {kartlar.length === 0 ? (
        <Card className="premium-card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/60 mb-4">Henüz kredi kartı eklenmemiş</p>
          <Button onClick={onKartEkle} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            İlk Kartınızı Ekleyin
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {kartlar.map((kk) => {
            const kullanim = kk.limit ? Math.min(100, (kk.bakiye / kk.limit) * 100) : null
            const taksitSayisi = kk.taksit_planlari?.length || 0
            const taksitToplam = (kk.taksit_planlari || []).reduce((s, tp) => {
              return s + (tp.aylik_odemeler
                ? tp.aylik_odemeler.reduce((a, v) => a + v, 0)
                : tp.aylik_tutar * tp.kalan_taksit)
            }, 0)

            return (
              <button
                key={kk.id}
                onClick={() => onKartSec(kk)}
                className="glass rounded-xl border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left p-4 sm:p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{kk.ad}</p>
                      <p className="text-[10px] text-white/40">
                        Ekstre: {kk.ekstre_kesim_gunu}. gün
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors mt-1" />
                </div>

                {/* Toplam borç */}
                <p className="text-xl sm:text-2xl font-bold text-danger mb-1">{formatPara(kk.bakiye)}</p>
                <p className="text-[10px] text-white/40 mb-3">toplam borç</p>

                {/* Borç dağılımı */}
                <div className="space-y-1 mb-3">
                  {kk.donem_borcu && kk.donem_borcu > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">📋 Güncel ekstre</span>
                      <span className="text-warning font-medium">{formatPara(kk.donem_borcu)}</span>
                    </div>
                  ) : null}
                  {kk.donem_ici_harcama && kk.donem_ici_harcama > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">🛒 Dönem içi</span>
                      <span className="text-white/70">{formatPara(kk.donem_ici_harcama)}</span>
                    </div>
                  ) : null}
                  {taksitSayisi > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">💳 {taksitSayisi} taksit planı</span>
                      <span className="text-white/70">{formatPara(taksitToplam)}</span>
                    </div>
                  )}
                </div>

                {/* Limit barı */}
                {kullanim !== null && (
                  <div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${kullanim}%`,
                          background: kullanim > 80 ? '#ef4444' : kullanim > 50 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
                      <span>{Math.round(kullanim)}% kullanım</span>
                      <span>Limit: {formatPara(kk.limit!)}</span>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// KART DETAY
// ────────────────────────────────────────────────────────────────
function KartDetay({
  kart,
  veriler,
  onGeri,
  onVerilerGuncelle,
}: {
  kart: KrediKarti
  veriler: FinansalVeriler
  onGeri: () => void
  onVerilerGuncelle: (yeni: FinansalVeriler) => void
}) {
  const kartlar = veriler.kredi_kartlari || []

  const [kartModalOpen, setKartModalOpen] = useState(false)
  const [taksitModalOpen, setTaksitModalOpen] = useState(false)
  const [duzenlenecekTaksit, setDuzenlenecekTaksit] = useState<TaksitPlani | undefined>(undefined)
  const [odemeModalOpen, setOdemeModalOpen] = useState(false)
  const [ekstreEdit, setEkstreEdit] = useState(false)
  const [ekstreEditDeger, setEkstreEditDeger] = useState('')
  const [donemIciEdit, setDonemIciEdit] = useState(false)
  const [donemIciEditDeger, setDonemIciEditDeger] = useState('')
  const [acikAy, setAcikAy] = useState<string | null>(null)
  const [editingKalem, setEditingKalem] = useState<{ taksitId: number; tip: 'yeni' | 'eski'; ayIdx: number } | null>(null)
  const [editTutar, setEditTutar] = useState('')

  // Güncel kart verisini her zaman verilerden çek
  const guncelKart = kartlar.find((k) => k.id === kart.id) || kart

  const takvim = odemeTakvimiHesapla(guncelKart)
  const kullanim = guncelKart.limit ? Math.min(100, (guncelKart.bakiye / guncelKart.limit) * 100) : null

  const taksitKalanToplam = [
    ...(guncelKart.taksit_planlari || []).map((tp) =>
      tp.aylik_odemeler ? tp.aylik_odemeler.reduce((a, v) => a + v, 0) : tp.aylik_tutar * tp.kalan_taksit
    ),
    ...(guncelKart.taksitler || []).map((t) =>
      t.aylik_odemeler ? t.aylik_odemeler.reduce((a, v) => a + v, 0) : t.aylik_tutar * t.kalan_taksit
    ),
  ].reduce((s, v) => s + v, 0)

  const handleKartSil = () => {
    if (!confirm(`"${guncelKart.ad}" kartını silmek istediğinize emin misiniz?`)) return
    const yeniVeriler = {
      ...veriler,
      kredi_kartlari: kartlar.filter((k) => k.id !== guncelKart.id),
      harcamalar: veriler.harcamalar?.filter((h) => !(h.tip === 'kredi_karti' && h.kredi_karti_id === guncelKart.id)),
    }
    saveData(yeniVeriler)
    onVerilerGuncelle(yeniVeriler)
    onGeri()
  }

  const handleTaksitSil = (taksitId: number) => {
    if (!confirm('Bu taksit planını silmek istediğinize emin misiniz?')) return
    const guncel = { ...guncelKart, taksit_planlari: (guncelKart.taksit_planlari || []).filter((tp) => tp.id !== taksitId) }
    const yeniVeriler = {
      ...veriler,
      kredi_kartlari: kartlar.map((k) => k.id === guncel.id ? { ...guncel, bakiye: hesaplaBakiye(guncel) } : k),
    }
    saveData(yeniVeriler)
    onVerilerGuncelle(yeniVeriler)
  }

  const handleKalemSave = (taksitId: number, tip: 'yeni' | 'eski', ayIdx: number) => {
    const yeniTutar = parseFloat(editTutar.replace(',', '.'))
    if (isNaN(yeniTutar) || yeniTutar < 0) return

    const yeniKart = { ...guncelKart }

    if (tip === 'yeni' && yeniKart.taksit_planlari) {
      yeniKart.taksit_planlari = yeniKart.taksit_planlari.map((tp) => {
        if (tp.id !== taksitId) return tp
        const aylar = tp.aylik_odemeler
          ? [...tp.aylik_odemeler]
          : Array.from({ length: tp.kalan_taksit }, () => tp.aylik_tutar)
        aylar[ayIdx] = yeniTutar
        return { ...tp, aylik_odemeler: aylar }
      })
    } else if (tip === 'eski' && yeniKart.taksitler) {
      yeniKart.taksitler = yeniKart.taksitler.map((t) => {
        if (t.id !== taksitId) return t
        const aylar = t.aylik_odemeler
          ? [...t.aylik_odemeler]
          : Array.from({ length: t.kalan_taksit }, () => t.aylik_tutar)
        aylar[ayIdx] = yeniTutar
        return { ...t, aylik_odemeler: aylar }
      })
    }

    const yeniVeriler = {
      ...veriler,
      kredi_kartlari: kartlar.map((k) =>
        k.id === yeniKart.id ? { ...yeniKart, bakiye: hesaplaBakiye(yeniKart) } : k
      ),
    }
    saveData(yeniVeriler)
    onVerilerGuncelle(yeniVeriler)
    setEditingKalem(null)
    setEditTutar('')
  }

  const handleEkstreSave = () => {
    const tutar = parseFloat(ekstreEditDeger.replace(',', '.')) || 0
    const guncel = { ...guncelKart, donem_borcu: tutar > 0 ? tutar : undefined }
    const yeniVeriler = {
      ...veriler,
      kredi_kartlari: kartlar.map((k) => k.id === guncel.id ? { ...guncel, bakiye: hesaplaBakiye(guncel) } : k),
    }
    saveData(yeniVeriler)
    onVerilerGuncelle(yeniVeriler)
    setEkstreEdit(false)
  }

  const handleDonemIciSave = () => {
    const tutar = parseFloat(donemIciEditDeger.replace(',', '.')) || 0
    const guncel = { ...guncelKart, donem_ici_harcama: tutar > 0 ? tutar : undefined }
    const yeniVeriler = {
      ...veriler,
      kredi_kartlari: kartlar.map((k) => k.id === guncel.id ? { ...guncel, bakiye: hesaplaBakiye(guncel) } : k),
    }
    saveData(yeniVeriler)
    onVerilerGuncelle(yeniVeriler)
    setDonemIciEdit(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGeri}
          className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center hover:border-white/30 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white">{guncelKart.ad}</h1>
          <p className="text-xs text-white/50">
            Ekstre: her ayın {guncelKart.ekstre_kesim_gunu}. günü
            {' · '}
            Son ödeme: {guncelKart.son_odeme_gunu} gün sonra
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={() => setKartModalOpen(true)} variant="ghost" size="sm">
            <Pencil className="w-4 h-4 text-primary" />
          </Button>
          <Button onClick={handleKartSil} variant="ghost" size="sm">
            <Trash2 className="w-4 h-4 text-danger" />
          </Button>
        </div>
      </div>

      {/* Toplam borç + limit */}
      <Card className="premium-card p-4 sm:p-6">
        <p className="text-xs text-white/50 mb-1">Toplam Borç</p>
        <p className="text-3xl sm:text-4xl font-bold text-danger mb-4">{formatPara(guncelKart.bakiye)}</p>

        {/* Dağılım */}
        <div className="space-y-2 mb-4">
          {guncelKart.donem_borcu && guncelKart.donem_borcu > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">📋 Güncel ekstre borcu</span>
              <span className="text-warning font-semibold">{formatPara(guncelKart.donem_borcu)}</span>
            </div>
          ) : null}
          {guncelKart.donem_ici_harcama && guncelKart.donem_ici_harcama > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">🛒 Dönem içi harcama</span>
              <span className="text-white/80">{formatPara(guncelKart.donem_ici_harcama)}</span>
            </div>
          ) : null}
          {taksitKalanToplam > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-white/60">💳 Gelecek taksit ödemeleri</span>
              <span className="text-white/80">{formatPara(taksitKalanToplam)}</span>
            </div>
          )}
          {(guncelKart.donem_borcu || guncelKart.donem_ici_harcama || taksitKalanToplam > 0) && (
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
              <span className="text-white/40">Toplam</span>
              <span className="text-danger font-bold">{formatPara(guncelKart.bakiye)}</span>
            </div>
          )}
        </div>

        {/* Limit barı */}
        {kullanim !== null && (
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Kullanım</span>
              <span>Limit: {formatPara(guncelKart.limit!)}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${kullanim}%`,
                  background: kullanim > 80 ? '#ef4444' : kullanim > 50 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
            <p className="text-xs text-white/40 mt-0.5 text-right">
              Kalan: {formatPara(guncelKart.limit! - guncelKart.bakiye)}
            </p>
          </div>
        )}
      </Card>

      {/* Ekstre + Dönem İçi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ekstre borcu */}
        <Card className="premium-card p-4">
          <p className="text-xs text-white/50 mb-2">📋 Güncel Ekstre Borcu</p>
          {ekstreEdit ? (
            <div className="space-y-2">
              <Input label="" value={ekstreEditDeger} onChange={(e) => setEkstreEditDeger(e.target.value)} placeholder="0" autoFocus />
              <div className="flex gap-2">
                <Button onClick={handleEkstreSave} variant="success" size="sm" className="flex-1 text-xs">Kaydet</Button>
                <Button onClick={() => setEkstreEdit(false)} variant="secondary" size="sm" className="flex-1 text-xs">İptal</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-warning">{guncelKart.donem_borcu ? formatPara(guncelKart.donem_borcu) : '—'}</p>
              <p className="text-[10px] text-white/40 mt-0.5 mb-3">Kilitli ekstre, gelecek son ödeme gününde ödenecek</p>
              <div className="flex gap-2">
                <Button onClick={() => { setEkstreEditDeger(guncelKart.donem_borcu?.toString() || ''); setEkstreEdit(true) }} variant="ghost" size="sm" className="flex-1 text-xs">
                  <Pencil className="w-3 h-3 mr-1" /> Düzenle
                </Button>
                {guncelKart.donem_borcu && guncelKart.donem_borcu > 0 && (
                  <Button onClick={() => setOdemeModalOpen(true)} variant="success" size="sm" className="flex-1 text-xs">
                    💰 Öde
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Dönem içi */}
        <Card className="premium-card p-4">
          <p className="text-xs text-white/50 mb-2">🛒 Dönem İçi Harcama</p>
          {donemIciEdit ? (
            <div className="space-y-2">
              <Input label="" value={donemIciEditDeger} onChange={(e) => setDonemIciEditDeger(e.target.value)} placeholder="0" autoFocus />
              <div className="flex gap-2">
                <Button onClick={handleDonemIciSave} variant="success" size="sm" className="flex-1 text-xs">Kaydet</Button>
                <Button onClick={() => setDonemIciEdit(false)} variant="secondary" size="sm" className="flex-1 text-xs">İptal</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white/80">{guncelKart.donem_ici_harcama ? formatPara(guncelKart.donem_ici_harcama) : '—'}</p>
              <p className="text-[10px] text-white/40 mt-0.5 mb-3">Sonraki ekstreden kesilecek</p>
              <Button onClick={() => { setDonemIciEditDeger(guncelKart.donem_ici_harcama?.toString() || ''); setDonemIciEdit(true) }} variant="ghost" size="sm" className="w-full text-xs">
                <Pencil className="w-3 h-3 mr-1" /> Düzenle
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Taksit Planları */}
      <Card className="premium-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Taksit Planları</h3>
            <p className="text-xs text-white/50">{(guncelKart.taksit_planlari || []).length + (guncelKart.taksitler || []).length} aktif plan · Kalan: {formatPara(taksitKalanToplam)}</p>
          </div>
          <Button onClick={() => { setDuzenlenecekTaksit(undefined); setTaksitModalOpen(true) }} variant="primary" size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Taksit Ekle
          </Button>
        </div>

        {(guncelKart.taksit_planlari || []).length === 0 && (guncelKart.taksitler || []).length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/40 text-sm">Henüz taksit planı eklenmemiş</p>
            <p className="text-white/30 text-xs mt-1">TV, beyaz eşya, telefon gibi taksitli alışverişlerinizi ekleyin</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(guncelKart.taksit_planlari || []).map((tp) => {
              const kalanToplam = tp.aylik_odemeler
                ? tp.aylik_odemeler.reduce((s, v) => s + v, 0)
                : tp.aylik_tutar * tp.kalan_taksit
              const odenmisTaksit = tp.toplam_taksit - tp.kalan_taksit
              const bitisTarihi = (() => {
                const [y, m] = tp.baslangic.split('-').map(Number)
                return format(new Date(y, m - 1 + tp.kalan_taksit - 1, 1), 'MMM yyyy', { locale: tr })
              })()

              return (
                <div key={tp.id} className="glass rounded-xl p-3 sm:p-4 border border-white/10">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{tp.aciklama}</p>
                      <p className="text-xs text-white/50">
                        {tp.toplam_taksit - tp.kalan_taksit + 1}/{tp.toplam_taksit} taksit · {formatPara(tp.aylik_tutar)}/ay · bitiş: {bitisTarihi}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button onClick={() => { setDuzenlenecekTaksit(tp); setTaksitModalOpen(true) }} variant="ghost" size="sm">
                        <Pencil className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button onClick={() => handleTaksitSil(tp.id)} variant="ghost" size="sm">
                        <Trash2 className="w-3.5 h-3.5 text-danger" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(odenmisTaksit / tp.toplam_taksit) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-white/40">{ayAdi(tp.baslangic)} başlangıç</p>
                    <p className="text-xs font-semibold text-warning">Kalan: {formatPara(kalanToplam)}</p>
                  </div>
                </div>
              )
            })}

            {/* Eski format taksitler */}
            {(guncelKart.taksitler || []).map((t) => {
              const kalanToplam = t.aylik_odemeler
                ? t.aylik_odemeler.reduce((s, v) => s + v, 0)
                : t.aylik_tutar * t.kalan_taksit
              const odenmisTaksit = t.toplam_taksit - t.kalan_taksit
              return (
                <div key={t.id} className="glass rounded-xl p-3 sm:p-4 border border-warning/20">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{t.aciklama}</p>
                      <p className="text-xs text-white/50">
                        {t.kalan_taksit}/{t.toplam_taksit} taksit kaldı · {formatPara(t.aylik_tutar)}/ay
                      </p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${(odenmisTaksit / t.toplam_taksit) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-warning/60">İlk ödeme: {t.sonraki_taksit_tarihi}</p>
                    <p className="text-xs font-semibold text-warning">Kalan: {formatPara(kalanToplam)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Ödeme Takvimi */}
      {takvim.length > 0 && (
        <Card className="premium-card p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">📅 Gelecek Ekstreler</h3>
          <p className="text-xs text-white/50 mb-4">Aya tıklayarak detayları görün ve düzenleyin</p>
          <div className="space-y-2">
            {takvim.map((satir) => {
              const acik = acikAy === satir.ay
              return (
                <div key={satir.ay} className="glass rounded-xl border border-white/10 overflow-hidden">
                  {/* Ay başlığı — tıklanabilir */}
                  <button
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors"
                    onClick={() => setAcikAy(acik ? null : satir.ay)}
                  >
                    <div className="flex items-center gap-2">
                      {acik ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                      <p className="text-sm font-bold text-white capitalize">{satir.ayAdi}</p>
                      <span className="text-[10px] text-white/40">{satir.taksitler.length + (satir.ekstreBorcu > 0 ? 1 : 0) + (satir.donemIci > 0 ? 1 : 0)} kalem</span>
                    </div>
                    <p className="text-sm font-bold text-warning">{formatPara(satir.toplam)}</p>
                  </button>

                  {/* Detay — açık ise görünür */}
                  {acik && (
                    <div className="border-t border-white/10 px-3 sm:px-4 pb-3 sm:pb-4 pt-2 space-y-2">
                      {/* Ekstre borcu */}
                      {satir.ekstreBorcu > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-xs text-white/60">📋 Ekstre borcu</span>
                          <span className="text-xs font-semibold text-warning">{formatPara(satir.ekstreBorcu)}</span>
                        </div>
                      )}

                      {/* Dönem içi */}
                      {satir.donemIci > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span className="text-xs text-white/60">🛒 Dönem içi harcama</span>
                          <span className="text-xs font-semibold text-white/70">{formatPara(satir.donemIci)}</span>
                        </div>
                      )}

                      {/* Taksit kalemleri */}
                      {satir.taksitler.map((t, i) => {
                        const editing = editingKalem?.taksitId === t.taksitId &&
                          editingKalem?.tip === t.tip &&
                          editingKalem?.ayIdx === t.ayIdx
                        return (
                          <div key={i} className="py-1.5 border-b border-white/5 last:border-0">
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="text-xs text-white/60 block truncate">💳 {t.aciklama}</span>
                                <span className="text-[10px] text-white/30">Taksit {t.taksitNo}/{t.toplamTaksit}</span>
                              </div>
                              {editing ? (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <input
                                    className="w-24 px-2 py-1 text-xs glass border border-primary/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={editTutar}
                                    onChange={(e) => setEditTutar(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleKalemSave(t.taksitId, t.tip, t.ayIdx)
                                      if (e.key === 'Escape') { setEditingKalem(null); setEditTutar('') }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleKalemSave(t.taksitId, t.tip, t.ayIdx)}
                                    className="p-1 rounded-lg bg-success/20 hover:bg-success/30 transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5 text-success" />
                                  </button>
                                  <button
                                    onClick={() => { setEditingKalem(null); setEditTutar('') }}
                                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-white/60" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs font-semibold text-white/80">{formatPara(t.tutar)}</span>
                                  <button
                                    onClick={() => {
                                      setEditingKalem({ taksitId: t.taksitId, tip: t.tip, ayIdx: t.ayIdx })
                                      setEditTutar(t.tutar.toString())
                                    }}
                                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3 text-white/30 hover:text-primary" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-white/30">Toplam</span>
                        <span className="text-xs font-bold text-warning">{formatPara(satir.toplam)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Modals */}
      <KrediKartiEkleModal
        isOpen={kartModalOpen}
        onClose={() => setKartModalOpen(false)}
        veriler={veriler}
        onSave={(yeniVeriler) => { saveData(yeniVeriler); onVerilerGuncelle(yeniVeriler); setKartModalOpen(false) }}
        mevcutKart={guncelKart}
      />

      <TaksitEkleModal
        isOpen={taksitModalOpen}
        onClose={() => { setTaksitModalOpen(false); setDuzenlenecekTaksit(undefined) }}
        kartId={guncelKart.id}
        veriler={veriler}
        onSave={(yeniVeriler) => { saveData(yeniVeriler); onVerilerGuncelle(yeniVeriler); setTaksitModalOpen(false); setDuzenlenecekTaksit(undefined) }}
        mevcutTaksit={duzenlenecekTaksit}
      />

      <KrediKartiOdemeModal
        isOpen={odemeModalOpen}
        onClose={() => setOdemeModalOpen(false)}
        krediKarti={guncelKart}
        veriler={veriler}
        onSave={(yeniVeriler) => { saveData(yeniVeriler); onVerilerGuncelle(yeniVeriler); setOdemeModalOpen(false) }}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// ANA SAYFA
// ────────────────────────────────────────────────────────────────
export default function KartlarPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [seciliKart, setSeciliKart] = useState<KrediKarti | null>(null)
  const [kartModalOpen, setKartModalOpen] = useState(false)

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

  const kartlar = veriler.kredi_kartlari || []

  const handleVerilerGuncelle = (yeni: FinansalVeriler) => {
    setVeriler(yeni)
    // Seçili kartı da güncelle
    if (seciliKart) {
      const guncel = yeni.kredi_kartlari?.find((k) => k.id === seciliKart.id)
      if (guncel) setSeciliKart(guncel)
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">

        {seciliKart ? (
          <KartDetay
            kart={seciliKart}
            veriler={veriler}
            onGeri={() => setSeciliKart(null)}
            onVerilerGuncelle={handleVerilerGuncelle}
          />
        ) : (
          <>
            <KartListesi
              kartlar={kartlar}
              onKartSec={setSeciliKart}
              onKartEkle={() => setKartModalOpen(true)}
            />

            <KrediKartiEkleModal
              isOpen={kartModalOpen}
              onClose={() => setKartModalOpen(false)}
              veriler={veriler}
              onSave={(yeniVeriler) => {
                saveData(yeniVeriler)
                setVeriler(yeniVeriler)
                setKartModalOpen(false)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
