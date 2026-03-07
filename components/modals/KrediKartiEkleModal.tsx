'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar, formatPara } from '@/lib/utils'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import { format, addMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { FinansalVeriler, KrediKarti, TaksitPlani } from '@/types'

interface KrediKartiEkleModalProps {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
  mevcutKart?: KrediKarti
}

function ayAdi(yyyyMM: string): string {
  try {
    const [yil, ay] = yyyyMM.split('-').map(Number)
    return format(new Date(yil, ay - 1, 1), 'MMMM yyyy', { locale: tr })
  } catch {
    return yyyyMM
  }
}

// Sonraki N ayı üret (YYYY-MM formatında)
function sonrakiAylar(baslangicOffset: number, sayi: number): string[] {
  return Array.from({ length: sayi }, (_, i) =>
    format(addMonths(new Date(), baslangicOffset + i), 'yyyy-MM')
  )
}

// ── ADIM GÖSTERGESİ ──────────────────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ['Kart Bilgileri', 'Güncel Durum', 'Gelecek Ekstreler', 'Özet']
  return (
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={n} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
              done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-white/10 text-white/30'
            }`}>
              {done ? <Check className="w-3.5 h-3.5" /> : n}
            </div>
            <span className={`text-[10px] truncate ${active ? 'text-white/80' : done ? 'text-success/70' : 'text-white/20'}`}>
              {labels[i]}
            </span>
            {n < total && <div className={`flex-1 h-px mx-1 ${done ? 'bg-success/40' : 'bg-white/10'}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ── ANA MODAL ────────────────────────────────────────────────────
export function KrediKartiEkleModal({
  isOpen,
  onClose,
  veriler,
  onSave,
  mevcutKart,
}: KrediKartiEkleModalProps) {
  const isEdit = !!mevcutKart
  const [step, setStep] = useState(1)

  // Adım 1 — Temel bilgiler
  const [ad, setAd] = useState('')
  const [ekstreKesimGunu, setEkstreKesimGunu] = useState('15')
  const [sonOdemeGunu, setSonOdemeGunu] = useState('10')
  const [limit, setLimit] = useState('')
  const [asgariOdemeOrani, setAsgariOdemeOrani] = useState('20')
  const [faizOrani, setFaizOrani] = useState('2.5')

  // Adım 2 — Güncel durum
  const [donemBorcu, setDonemBorcu] = useState('')
  const [donemIci, setDonemIci] = useState('')

  // Adım 3 — Gelecek ekstreler: her ay için bir tutar
  // { ay: 'YYYY-MM', tutar: string }[]
  const [gelecekEkstreler, setGelecekEkstreler] = useState<{ ay: string; tutar: string }[]>([])

  // Modal açıldığında sıfırla
  useEffect(() => {
    if (!isOpen) return
    setStep(1)

    // Gelecek 8 ayı boş olarak oluştur (ilk ay = gelecek ekstre dönemi)
    setGelecekEkstreler(sonrakiAylar(1, 8).map((ay) => ({ ay, tutar: '' })))

    if (mevcutKart) {
      setAd(mevcutKart.ad)
      setEkstreKesimGunu(mevcutKart.ekstre_kesim_gunu.toString())
      setSonOdemeGunu(mevcutKart.son_odeme_gunu.toString())
      setLimit(mevcutKart.limit?.toString() || '')
      setAsgariOdemeOrani(mevcutKart.asgari_odeme_orani?.toString() || '20')
      setFaizOrani(mevcutKart.faiz_orani?.toString() || '2.5')
    } else {
      setAd('')
      setEkstreKesimGunu('15')
      setSonOdemeGunu('10')
      setLimit('')
      setAsgariOdemeOrani('20')
      setFaizOrani('2.5')
      setDonemBorcu('')
      setDonemIci('')
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTutarDegistir = (idx: number, deger: string) => {
    setGelecekEkstreler((prev) => prev.map((item, i) => i === idx ? { ...item, tutar: deger } : item))
  }

  // ── EDIT MODU — Basit tek form ────────────────────────────────
  if (isEdit) {
    const handleEditSave = (e: React.FormEvent) => {
      e.preventDefault()
      if (!ad.trim()) { alert('Kart adı gerekli!'); return }
      const ekstreGun = parseInt(ekstreKesimGunu)
      const odemeGun = parseInt(sonOdemeGunu)
      if (ekstreGun < 1 || ekstreGun > 31 || odemeGun < 1 || odemeGun > 31) {
        alert('Günler 1-31 arası olmalı!')
        return
      }
      const kartVerisi: KrediKarti = {
        id: mevcutKart!.id,
        ad: ad.trim(),
        ekstre_kesim_gunu: ekstreGun,
        son_odeme_gunu: odemeGun,
        limit: limit ? parseFloat(limit.replace(/\./g, '').replace(/,/g, '')) : undefined,
        asgari_odeme_orani: asgariOdemeOrani ? parseFloat(asgariOdemeOrani.replace(',', '.')) : undefined,
        faiz_orani: faizOrani ? parseFloat(faizOrani.replace(',', '.')) : undefined,
        // Canlı veriler korunur
        donem_borcu: mevcutKart!.donem_borcu,
        donem_ici_harcama: mevcutKart!.donem_ici_harcama,
        taksit_planlari: mevcutKart!.taksit_planlari,
        odeme_plani: mevcutKart!.odeme_plani,
        taksitler: mevcutKart!.taksitler,
        bakiye: 0,
      }
      kartVerisi.bakiye = hesaplaBakiye(kartVerisi)
      const yeniVeriler: FinansalVeriler = {
        ...veriler,
        kredi_kartlari: (veriler.kredi_kartlari || []).map((kk) =>
          kk.id === mevcutKart!.id ? kartVerisi : kk
        ),
      }
      onSave(yeniVeriler)
      onClose()
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Kartı Düzenle" size="md">
        <form onSubmit={handleEditSave} className="space-y-4">
          <Input label="Kart Adı" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Akbank" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ekstre Kesim Günü (1-31)" type="number" min="1" max="31" value={ekstreKesimGunu} onChange={(e) => setEkstreKesimGunu(e.target.value)} required />
            <Input label="Son Ödeme (kaç gün sonra)" type="number" min="1" max="31" value={sonOdemeGunu} onChange={(e) => setSonOdemeGunu(e.target.value)} required />
          </div>
          <Input label="Kart Limiti (TL) — opsiyonel" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="50000" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Asgari Ödeme (%)" value={asgariOdemeOrani} onChange={(e) => setAsgariOdemeOrani(e.target.value)} type="number" step="0.1" />
            <Input label="Aylık Faiz (%)" value={faizOrani} onChange={(e) => setFaizOrani(e.target.value)} type="number" step="0.1" />
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/40">
              Ekstre borcu, dönem içi harcama ve gelecek ekstreler kart detay sayfasından yönetilir.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
            <Button type="submit" variant="primary" className="flex-1">Kaydet</Button>
          </div>
        </form>
      </Modal>
    )
  }

  // ── YENİ KART — 4 Adımlı Wizard ─────────────────────────────

  const step1Valid = ad.trim().length > 0 &&
    parseInt(ekstreKesimGunu) >= 1 && parseInt(ekstreKesimGunu) <= 31 &&
    parseInt(sonOdemeGunu) >= 1 && parseInt(sonOdemeGunu) <= 31

  // Dolu ayları bul (tutar > 0 olanlar)
  const doluAylar = gelecekEkstreler.filter((item) => parseTutar(item.tutar) > 0)
  const gelecekToplam = doluAylar.reduce((s, item) => s + parseTutar(item.tutar), 0)

  const donemBorcuTutar = parseTutar(donemBorcu)
  const donemIciTutar = parseTutar(donemIci)
  const toplamBorc = donemBorcuTutar + donemIciTutar + gelecekToplam

  const handleFinalSave = () => {
    const ekstreGun = parseInt(ekstreKesimGunu)
    const odemeGun = parseInt(sonOdemeGunu)

    const yeniId = Math.max(...(veriler.kredi_kartlari?.map((kk) => kk.id) || [0]), 0) + 1

    // Dolu aylardan TaksitPlani oluştur
    let taksitPlan: TaksitPlani | undefined
    if (doluAylar.length > 0) {
      // Başlangıç ayından bitiş ayına kadar tüm aralığı kapsayan aylik_odemeler dizisi
      const ilkAy = doluAylar[0].ay
      const [ilkYil, ilkAyNo] = ilkAy.split('-').map(Number)
      const ilkIdx = ilkYil * 12 + ilkAyNo - 1

      const sonAy = doluAylar[doluAylar.length - 1].ay
      const [sonYil, sonAyNo] = sonAy.split('-').map(Number)
      const sonIdx = sonYil * 12 + sonAyNo - 1

      const uzunluk = sonIdx - ilkIdx + 1
      const aylikOdemeler = Array(uzunluk).fill(0)

      for (const item of doluAylar) {
        const [y, m] = item.ay.split('-').map(Number)
        const idx = (y * 12 + m - 1) - ilkIdx
        aylikOdemeler[idx] = parseTutar(item.tutar)
      }

      taksitPlan = {
        id: Date.now(),
        aciklama: 'Gelecek Ekstreler',
        toplam_tutar: gelecekToplam,
        toplam_taksit: uzunluk,
        kalan_taksit: uzunluk,
        baslangic: ilkAy,
        aylik_tutar: Math.round(gelecekToplam / uzunluk),
        aylik_odemeler: aylikOdemeler,
      }
    }

    const kartVerisi: KrediKarti = {
      id: yeniId,
      ad: ad.trim(),
      ekstre_kesim_gunu: ekstreGun,
      son_odeme_gunu: odemeGun,
      limit: limit ? parseFloat(limit.replace(/\./g, '').replace(/,/g, '')) : undefined,
      asgari_odeme_orani: asgariOdemeOrani ? parseFloat(asgariOdemeOrani.replace(',', '.')) : undefined,
      faiz_orani: faizOrani ? parseFloat(faizOrani.replace(',', '.')) : undefined,
      donem_borcu: donemBorcuTutar > 0 ? donemBorcuTutar : undefined,
      donem_ici_harcama: donemIciTutar > 0 ? donemIciTutar : undefined,
      taksit_planlari: taksitPlan ? [taksitPlan] : [],
      bakiye: 0,
    }
    kartVerisi.bakiye = hesaplaBakiye(kartVerisi)

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      kredi_kartlari: [...(veriler.kredi_kartlari || []), kartVerisi],
    }
    onSave(yeniVeriler)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kredi Kartı Ekle" size="lg">
      <StepIndicator step={step} total={4} />

      {/* ── ADIM 1: Kart Bilgileri ────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Kart Adı"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Örn: Akbank, Garanti, İş Bankası"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Ekstre Kesim Günü (1-31)"
                type="number" min="1" max="31"
                value={ekstreKesimGunu}
                onChange={(e) => setEkstreKesimGunu(e.target.value)}
                required
              />
              <p className="text-[10px] text-white/30 mt-1">Her ayın kaçında ekstreni kesilir?</p>
            </div>
            <div>
              <Input
                label="Son Ödeme (ekstre + kaç gün)"
                type="number" min="1" max="31"
                value={sonOdemeGunu}
                onChange={(e) => setSonOdemeGunu(e.target.value)}
                required
              />
              <p className="text-[10px] text-white/30 mt-1">Ekstre kesiminden kaç gün sonra?</p>
            </div>
          </div>
          <Input
            label="Kart Limiti (TL) — opsiyonel"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="50000"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Asgari Ödeme (%)" value={asgariOdemeOrani} onChange={(e) => setAsgariOdemeOrani(e.target.value)} type="number" step="0.1" placeholder="20" />
            <Input label="Aylık Faiz (%)" value={faizOrani} onChange={(e) => setFaizOrani(e.target.value)} type="number" step="0.1" placeholder="2.5" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
            <Button
              type="button" variant="primary" className="flex-1"
              onClick={() => step1Valid ? setStep(2) : alert('Kart adı ve günleri doldurun!')}
            >
              İleri <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ADIM 2: Güncel Durum ──────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="glass rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-white/60">
              Bankacılık uygulamanı aç, <strong className="text-white/80">{ad}</strong> kartının
              son durumuna bak. Yeni bir kartsa boş bırakabilirsin.
            </p>
          </div>

          <div>
            <Input
              label="Güncel Ekstre Borcu (TL)"
              value={donemBorcu}
              onChange={(e) => setDonemBorcu(e.target.value)}
              placeholder="0"
              type="number"
              autoFocus
            />
            <p className="text-[10px] text-white/30 mt-1.5">
              Kilitlenmiş ekstre, gelecek son ödeme tarihinde ödenecek.
              Bankacılık uygulamasında "Ekstre Borcu" veya "Son Hesap Özeti" olarak görünür.
            </p>
          </div>

          <div>
            <Input
              label="Dönem İçi Harcama (TL)"
              value={donemIci}
              onChange={(e) => setDonemIci(e.target.value)}
              placeholder="0"
              type="number"
            />
            <p className="text-[10px] text-white/30 mt-1.5">
              Henüz ekstreye girmemiş bu dönem yapılan harcamalar.
              Bankacılık uygulamasında "Dönem İçi" veya "Cari Dönem" olarak görünür.
            </p>
          </div>

          {(donemBorcuTutar > 0 || donemIciTutar > 0) && (
            <div className="glass rounded-lg p-3 border border-white/10 flex justify-between items-center">
              <span className="text-xs text-white/50">Bu adım toplamı</span>
              <span className="text-sm font-bold text-warning">{formatPara(donemBorcuTutar + donemIciTutar)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1 inline" /> Geri
            </Button>
            <Button type="button" variant="primary" onClick={() => setStep(3)} className="flex-1">
              İleri <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ADIM 3: Gelecek Ekstreler ─────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="glass rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-white/60">
              Bankacılık uygulamasında <strong className="text-white/80">"Gelecek Ekstreler"</strong> veya{' '}
              <strong className="text-white/80">"Taksitli İşlemler"</strong> bölümüne bak.
              Her ay için toplam tutarı gir, bileceğin kadar. Boş bıraktığın aylar atlanır.
            </p>
          </div>

          <div className="space-y-2">
            {gelecekEkstreler.map((item, idx) => {
              const tutar = parseTutar(item.tutar)
              return (
                <div key={item.ay} className="flex items-center gap-3">
                  <span className={`text-sm w-32 flex-shrink-0 capitalize ${tutar > 0 ? 'text-white font-medium' : 'text-white/40'}`}>
                    {ayAdi(item.ay)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={item.tutar}
                    onChange={(e) => handleTutarDegistir(idx, e.target.value)}
                    placeholder="—"
                    className={`flex-1 px-3 py-2 glass border rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      tutar > 0
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-white/10 text-white/60'
                    }`}
                  />
                  {tutar > 0 && (
                    <span className="text-xs text-warning font-semibold w-20 text-right flex-shrink-0">
                      {formatPara(tutar)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {gelecekToplam > 0 && (
            <div className="glass rounded-lg p-3 border border-warning/20 flex justify-between items-center">
              <span className="text-xs text-white/50">{doluAylar.length} ay · Gelecek ekstreler toplamı</span>
              <span className="text-sm font-bold text-warning">{formatPara(gelecekToplam)}</span>
            </div>
          )}

          {gelecekToplam === 0 && (
            <p className="text-center text-xs text-white/30 py-1">
              Gelecek dönem ekstren yoksa boş bırakabilirsin
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1 inline" /> Geri
            </Button>
            <Button type="button" variant="primary" onClick={() => setStep(4)} className="flex-1">
              İleri <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ADIM 4: Özet & Kaydet ─────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-white">{ad}</p>
              {limit && (
                <span className="text-xs text-white/40">
                  Limit: {formatPara(parseFloat(limit.replace(/\./g, '').replace(/,/g, '')))}
                </span>
              )}
            </div>
            <div className="text-xs text-white/40 space-y-0.5">
              <p>Ekstre kesim: Her ayın {ekstreKesimGunu}. günü</p>
              <p>Son ödeme: Ekstre kesiminden {sonOdemeGunu} gün sonra</p>
            </div>

            {toplamBorc > 0 && (
              <div className="border-t border-white/10 pt-3 space-y-1.5">
                {donemBorcuTutar > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">📋 Güncel ekstre borcu</span>
                    <span className="text-warning font-semibold">{formatPara(donemBorcuTutar)}</span>
                  </div>
                )}
                {donemIciTutar > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">🛒 Dönem içi harcama</span>
                    <span className="text-white/80">{formatPara(donemIciTutar)}</span>
                  </div>
                )}
                {doluAylar.length > 0 && (
                  <>
                    {doluAylar.map((item) => (
                      <div key={item.ay} className="flex justify-between text-sm">
                        <span className="text-white/60 capitalize">📅 {ayAdi(item.ay)} ekstresi</span>
                        <span className="text-white/80">{formatPara(parseTutar(item.tutar))}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="border-t border-white/10 pt-1.5 flex justify-between text-sm font-bold">
                  <span className="text-white/50">Toplam borç</span>
                  <span className="text-danger">{formatPara(toplamBorc)}</span>
                </div>
              </div>
            )}

            {toplamBorc === 0 && (
              <p className="text-xs text-white/30 text-center py-1">Borç girilmedi — kart temiz ekleniyor</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(3)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1 inline" /> Geri
            </Button>
            <Button type="button" variant="success" onClick={handleFinalSave} className="flex-1 font-bold">
              Kartı Kaydet
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
