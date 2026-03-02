'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { addMonths } from 'date-fns'
import { parseTutar } from '@/lib/utils'
import { formatPara } from '@/lib/utils'
import type { FinansalVeriler, KrediKarti, KrediKartiTaksit } from '@/types'

interface KrediKartiEkleModalProps {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
}

export function KrediKartiEkleModal({
  isOpen,
  onClose,
  veriler,
  onSave,
}: KrediKartiEkleModalProps) {
  const [ad, setAd] = useState('')
  const [ekstreKesimGunu, setEkstreKesimGunu] = useState('15')
  const [sonOdemeGunu, setSonOdemeGunu] = useState('10')
  const [limit, setLimit] = useState('')
  const [baslangicBakiyesi, setBaslangicBakiyesi] = useState('')
  const [asgariOdemeOrani, setAsgariOdemeOrani] = useState('20')
  const [faizOrani, setFaizOrani] = useState('2.5')
  const [taksitler, setTaksitler] = useState<Array<{
    aciklama: string
    toplam_tutar: string
    aylik_tutar: string
    toplam_taksit: string
    kalan_taksit: string
    baslangic_tarihi: string
  }>>([])

  const handleTaksitEkle = () => {
    setTaksitler([
      ...taksitler,
      {
        aciklama: '',
        toplam_tutar: '',
        aylik_tutar: '',
        toplam_taksit: '',
        kalan_taksit: '',
        baslangic_tarihi: format(addMonths(new Date(), 1), 'dd.MM.yyyy'),
      },
    ])
  }

  const handleTaksitSil = (index: number) => {
    setTaksitler(taksitler.filter((_, i) => i !== index))
  }

  const handleTaksitGuncelle = (index: number, field: string, value: string) => {
    const yeniTaksitler = [...taksitler]
    yeniTaksitler[index] = { ...yeniTaksitler[index], [field]: value }
    setTaksitler(yeniTaksitler)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!ad.trim()) {
      alert('Kredi kartı adı gerekli!')
      return
    }

    const ekstreGun = parseInt(ekstreKesimGunu)
    const odemeGun = parseInt(sonOdemeGunu)

    if (ekstreGun < 1 || ekstreGun > 31 || odemeGun < 1 || odemeGun > 31) {
      alert('Günler 1-31 arası olmalı!')
      return
    }

    const yeniId = Math.max(...(veriler.kredi_kartlari?.map((kk) => kk.id) || [0]), 0) + 1

    // Başlangıç bakiyesi
    const baslangicBakiye = baslangicBakiyesi ? parseTutar(baslangicBakiyesi) : 0

    // Taksitleri işle
    const islenmisTaksitler: KrediKartiTaksit[] = taksitler
      .filter((t) => t.aciklama.trim() && t.toplam_tutar && t.aylik_tutar && t.toplam_taksit && t.kalan_taksit)
      .map((t, idx) => {
        const toplamTutar = parseTutar(t.toplam_tutar)
        const aylikTutar = parseTutar(t.aylik_tutar)
        const toplamTaksit = parseInt(t.toplam_taksit)
        const kalanTaksit = parseInt(t.kalan_taksit)

        // Sonraki taksit tarihini hesapla
        const [gun, ay, yil] = t.baslangic_tarihi.split('.')
        const baslangicTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
        const sonrakiTaksitTarihi = addMonths(baslangicTarihi, toplamTaksit - kalanTaksit)

        return {
          id: idx + 1,
          aciklama: t.aciklama.trim(),
          toplam_tutar: toplamTutar,
          aylik_tutar: aylikTutar,
          kalan_taksit: kalanTaksit,
          toplam_taksit: toplamTaksit,
          baslangic_tarihi: t.baslangic_tarihi,
          sonraki_taksit_tarihi: format(sonrakiTaksitTarihi, 'dd.MM.yyyy'),
        }
      })

    // Toplam bakiyeyi hesapla (başlangıç + taksitlerin kalan tutarları)
    const taksitToplamBakiye = islenmisTaksitler.reduce((sum, t) => {
      return sum + t.aylik_tutar * t.kalan_taksit
    }, 0)

    const toplamBakiye = baslangicBakiye + taksitToplamBakiye

    const yeniKrediKarti: KrediKarti = {
      id: yeniId,
      ad: ad.trim(),
      ekstre_kesim_gunu: ekstreGun,
      son_odeme_gunu: odemeGun,
      limit: limit ? parseFloat(limit.replace(/\./g, '').replace(/,/g, '')) : undefined,
      bakiye: toplamBakiye,
      asgari_odeme_orani: asgariOdemeOrani ? parseFloat(asgariOdemeOrani.replace(',', '.')) : undefined,
      faiz_orani: faizOrani ? parseFloat(faizOrani.replace(',', '.')) : undefined,
      taksitler: islenmisTaksitler.length > 0 ? islenmisTaksitler : undefined,
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      kredi_kartlari: [...(veriler.kredi_kartlari || []), yeniKrediKarti],
    }

    onSave(yeniVeriler)
    setAd('')
    setEkstreKesimGunu('15')
    setSonOdemeGunu('10')
    setLimit('')
    setBaslangicBakiyesi('')
    setAsgariOdemeOrani('20')
    setFaizOrani('2.5')
    setTaksitler([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💳 Kredi Kartı Ekle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Kart Adı"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Örn: Ziraat Bankası"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ekstre Kesim Günü (1-31)"
            type="number"
            min="1"
            max="31"
            value={ekstreKesimGunu}
            onChange={(e) => setEkstreKesimGunu(e.target.value)}
            required
          />

          <Input
            label="Son Ödeme Günü (Ekstre kesiminden kaç gün sonra)"
            type="number"
            min="1"
            max="31"
            value={sonOdemeGunu}
            onChange={(e) => setSonOdemeGunu(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Kart Limiti (TL) - Opsiyonel"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="50000"
          />

          <Input
            label="Başlangıç Bakiyesi (TL) - Opsiyonel"
            value={baslangicBakiyesi}
            onChange={(e) => setBaslangicBakiyesi(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Asgari Ödeme Oranı (%) - Opsiyonel"
            value={asgariOdemeOrani}
            onChange={(e) => setAsgariOdemeOrani(e.target.value)}
            placeholder="20"
            type="number"
            step="0.1"
          />

          <Input
            label="Aylık Faiz Oranı (%) - Opsiyonel"
            value={faizOrani}
            onChange={(e) => setFaizOrani(e.target.value)}
            placeholder="2.5"
            type="number"
            step="0.1"
          />
        </div>

        {/* Önceki Dönem Taksitleri */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Önceki Dönem Taksitleri (Opsiyonel)</h3>
              <p className="text-xs text-white/60">Kullanıma başlamadan önceki taksitleri ekleyin</p>
            </div>
            <Button type="button" onClick={handleTaksitEkle} variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Taksit Ekle
            </Button>
          </div>

          {taksitler.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {taksitler.map((taksit, idx) => (
                <div key={idx} className="glass rounded-lg p-3 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">Taksit #{idx + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => handleTaksitSil(idx)}
                      variant="ghost"
                      size="sm"
                      className="p-1"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      label="Açıklama"
                      value={taksit.aciklama}
                      onChange={(e) => handleTaksitGuncelle(idx, 'aciklama', e.target.value)}
                      placeholder="Örn: TV Alışverişi"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Toplam Tutar"
                        value={taksit.toplam_tutar}
                        onChange={(e) => handleTaksitGuncelle(idx, 'toplam_tutar', e.target.value)}
                        placeholder="5000"
                        required
                      />
                      <Input
                        label="Aylık Tutar"
                        value={taksit.aylik_tutar}
                        onChange={(e) => handleTaksitGuncelle(idx, 'aylik_tutar', e.target.value)}
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Toplam Taksit"
                        value={taksit.toplam_taksit}
                        onChange={(e) => handleTaksitGuncelle(idx, 'toplam_taksit', e.target.value)}
                        placeholder="5"
                        type="number"
                        required
                      />
                      <Input
                        label="Kalan Taksit"
                        value={taksit.kalan_taksit}
                        onChange={(e) => handleTaksitGuncelle(idx, 'kalan_taksit', e.target.value)}
                        placeholder="3"
                        type="number"
                        required
                      />
                    </div>
                    <Input
                      label="Başlangıç Tarihi (GG.AA.YYYY)"
                      value={taksit.baslangic_tarihi}
                      onChange={(e) => handleTaksitGuncelle(idx, 'baslangic_tarihi', e.target.value)}
                      placeholder="01.01.2024"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
