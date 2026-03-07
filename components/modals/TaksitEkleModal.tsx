'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar, formatPara } from '@/lib/utils'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import { format, addMonths } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { FinansalVeriler, TaksitPlani } from '@/types'

interface TaksitEkleModalProps {
  isOpen: boolean
  onClose: () => void
  kartId: number
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
  mevcutTaksit?: TaksitPlani
}

function ayAdi(yyyyMM: string): string {
  try {
    const [yil, ay] = yyyyMM.split('-').map(Number)
    const tarih = new Date(yil, ay - 1, 1)
    return format(tarih, 'MMMM yyyy', { locale: tr })
  } catch {
    return yyyyMM
  }
}

export function TaksitEkleModal({
  isOpen,
  onClose,
  kartId,
  veriler,
  onSave,
  mevcutTaksit,
}: TaksitEkleModalProps) {
  const [aciklama, setAciklama] = useState('')
  const [toplamTutar, setToplamTutar] = useState('')
  const [toplamTaksit, setToplamTaksit] = useState('')
  const [kalanTaksit, setKalanTaksit] = useState('')
  const [baslangic, setBaslangic] = useState(format(addMonths(new Date(), 1), 'yyyy-MM'))
  const [aylikTutar, setAylikTutar] = useState('')
  const [ozelPlan, setOzelPlan] = useState(false)
  const [aylikOdemeler, setAylikOdemeler] = useState<string[]>([])

  useEffect(() => {
    if (mevcutTaksit) {
      setAciklama(mevcutTaksit.aciklama)
      setToplamTutar(mevcutTaksit.toplam_tutar.toString())
      setToplamTaksit(mevcutTaksit.toplam_taksit.toString())
      setKalanTaksit(mevcutTaksit.kalan_taksit.toString())
      setBaslangic(mevcutTaksit.baslangic)
      setAylikTutar(mevcutTaksit.aylik_tutar.toFixed(2))
      if (mevcutTaksit.aylik_odemeler && mevcutTaksit.aylik_odemeler.length > 0) {
        setOzelPlan(true)
        setAylikOdemeler(mevcutTaksit.aylik_odemeler.map((v) => v.toFixed(2)))
      } else {
        setOzelPlan(false)
        setAylikOdemeler([])
      }
    } else {
      setAciklama('')
      setToplamTutar('')
      setToplamTaksit('')
      setKalanTaksit('')
      setBaslangic(format(addMonths(new Date(), 1), 'yyyy-MM'))
      setAylikTutar('')
      setOzelPlan(false)
      setAylikOdemeler([])
    }
  }, [mevcutTaksit, isOpen])

  // Aylık tutar otomatik hesapla
  useEffect(() => {
    const tutar = parseTutar(toplamTutar)
    const taksit = parseInt(toplamTaksit)
    if (tutar > 0 && taksit > 0) {
      setAylikTutar((tutar / taksit).toFixed(2))
    }
  }, [toplamTutar, toplamTaksit])

  // Kalan taksit değişince özel plan dizisini yeniden oluştur
  useEffect(() => {
    const kalan = parseInt(kalanTaksit) || 0
    if (ozelPlan && kalan > 0) {
      const mevcut = aylikOdemeler.slice(0, kalan)
      const eksik = kalan - mevcut.length
      setAylikOdemeler([...mevcut, ...Array(eksik).fill(aylikTutar || '0')])
    }
  }, [kalanTaksit, ozelPlan]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOzelPlanToggle = () => {
    if (!ozelPlan) {
      const kalan = parseInt(kalanTaksit) || 0
      setAylikOdemeler(Array(kalan).fill(aylikTutar || '0'))
    }
    setOzelPlan(!ozelPlan)
  }

  const handleOdemeDegistir = (idx: number, value: string) => {
    const yeni = [...aylikOdemeler]
    yeni[idx] = value
    setAylikOdemeler(yeni)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedToplam = parseTutar(toplamTutar)
    const parsedToplamTaksit = parseInt(toplamTaksit)
    const parsedKalan = parseInt(kalanTaksit)
    const parsedAylik = parseTutar(aylikTutar)

    if (!aciklama.trim()) { alert('Açıklama gerekli!'); return }
    if (parsedToplam <= 0) { alert('Geçerli bir tutar girin!'); return }
    if (!parsedToplamTaksit || parsedToplamTaksit < 1) { alert('Toplam taksit sayısı gerekli!'); return }
    if (!parsedKalan || parsedKalan < 1 || parsedKalan > parsedToplamTaksit) {
      alert('Kalan taksit sayısı 1 ile toplam taksit arasında olmalı!')
      return
    }
    if (parsedAylik <= 0) { alert('Geçerli aylık tutar girin!'); return }
    if (!baslangic) { alert('Başlangıç ayı seçin!'); return }

    const yeniTaksit: TaksitPlani = {
      id: mevcutTaksit ? mevcutTaksit.id : Date.now(),
      aciklama: aciklama.trim(),
      toplam_tutar: parsedToplam,
      toplam_taksit: parsedToplamTaksit,
      kalan_taksit: parsedKalan,
      baslangic,
      aylik_tutar: parsedAylik,
      harcama_id: mevcutTaksit?.harcama_id,
      ...(ozelPlan && aylikOdemeler.length === parsedKalan
        ? { aylik_odemeler: aylikOdemeler.map((v) => parseTutar(v)) }
        : {}),
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      kredi_kartlari: veriler.kredi_kartlari?.map((kk) => {
        if (kk.id !== kartId) return kk
        const mevcutPlanlar = (kk.taksit_planlari || []).filter(
          (tp) => tp.id !== yeniTaksit.id
        )
        const guncelKart = {
          ...kk,
          taksit_planlari: [...mevcutPlanlar, yeniTaksit],
        }
        return { ...guncelKart, bakiye: hesaplaBakiye(guncelKart) }
      }),
    }

    onSave(yeniVeriler)
    onClose()
  }

  const kalanSayi = parseInt(kalanTaksit) || 0
  const ozelToplamHesap = ozelPlan
    ? aylikOdemeler.reduce((s, v) => s + (parseTutar(v) || 0), 0)
    : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mevcutTaksit ? '✏️ Taksit Planını Düzenle' : '➕ Taksit Planı Ekle'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Açıklama"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Samsung TV, Bulaşık Makinesi"
          required
        />

        <Input
          label="Toplam Tutar (TL)"
          value={toplamTutar}
          onChange={(e) => setToplamTutar(e.target.value)}
          placeholder="10000"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Toplam Taksit Sayısı"
            type="number"
            min="1"
            max="120"
            value={toplamTaksit}
            onChange={(e) => setToplamTaksit(e.target.value)}
            placeholder="12"
            required
          />
          <Input
            label="Kalan Taksit Sayısı"
            type="number"
            min="1"
            max={toplamTaksit || '120'}
            value={kalanTaksit}
            onChange={(e) => setKalanTaksit(e.target.value)}
            placeholder="9"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/80 mb-2">
            İlk Kalan Ödeme Ayı
          </label>
          <input
            type="month"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
            required
            className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {baslangic && (
            <p className="text-xs text-white/50 mt-1">
              İlk kalan ödeme: {ayAdi(baslangic)}
            </p>
          )}
        </div>

        <Input
          label="Aylık Tutar (TL)"
          value={aylikTutar}
          onChange={(e) => setAylikTutar(e.target.value)}
          placeholder="Auto hesaplanır"
        />

        {/* Özet kutu */}
        {parseTutar(aylikTutar) > 0 && kalanSayi > 0 && (
          <div className="glass rounded-lg p-3 bg-primary/10 border border-primary/20">
            <p className="text-xs text-white/60 mb-1">Taksit Özeti</p>
            <p className="text-sm font-semibold text-white">
              {kalanSayi} × {formatPara(parseTutar(aylikTutar))} ={' '}
              {formatPara(parseTutar(aylikTutar) * kalanSayi)} kalan
            </p>
            {baslangic && (
              <p className="text-xs text-white/50 mt-0.5">
                {ayAdi(baslangic)} →{' '}
                {ayAdi(
                  (() => {
                    const [y, m] = baslangic.split('-').map(Number)
                    const d = new Date(y, m - 1 + kalanSayi - 1, 1)
                    return format(d, 'yyyy-MM')
                  })()
                )}
              </p>
            )}
          </div>
        )}

        {/* Özel plan toggle */}
        {kalanSayi > 0 && (
          <button
            type="button"
            onClick={handleOzelPlanToggle}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white hover:border-white/30 transition-all"
          >
            <span>Aylık ödemeleri özelleştir</span>
            {ozelPlan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Özel aylık ödemeler */}
        {ozelPlan && kalanSayi > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {Array.from({ length: kalanSayi }, (_, idx) => {
              const [y, m] = baslangic.split('-').map(Number)
              const ayTarihi = new Date(y, m - 1 + idx, 1)
              const ayLabel = format(ayTarihi, 'MMMM yyyy', { locale: tr })
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-white/50 w-28 shrink-0">{ayLabel}</span>
                  <Input
                    label=""
                    value={aylikOdemeler[idx] || ''}
                    onChange={(e) => handleOdemeDegistir(idx, e.target.value)}
                    placeholder="0"
                  />
                </div>
              )
            })}
            <p className="text-xs text-white/40 text-right pt-1">
              Toplam: {formatPara(ozelToplamHesap)}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
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
