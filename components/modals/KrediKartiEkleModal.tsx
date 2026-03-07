'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar } from '@/lib/utils'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import type { FinansalVeriler, KrediKarti } from '@/types'

interface KrediKartiEkleModalProps {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
  mevcutKart?: KrediKarti
}

export function KrediKartiEkleModal({
  isOpen,
  onClose,
  veriler,
  onSave,
  mevcutKart,
}: KrediKartiEkleModalProps) {
  const [ad, setAd] = useState('')
  const [ekstreKesimGunu, setEkstreKesimGunu] = useState('15')
  const [sonOdemeGunu, setSonOdemeGunu] = useState('10')
  const [limit, setLimit] = useState('')
  const [donemBorcu, setDonemBorcu] = useState('')
  const [donemIciHarcama, setDonemIciHarcama] = useState('')
  const [asgariOdemeOrani, setAsgariOdemeOrani] = useState('20')
  const [faizOrani, setFaizOrani] = useState('2.5')

  useEffect(() => {
    if (mevcutKart) {
      setAd(mevcutKart.ad)
      setEkstreKesimGunu(mevcutKart.ekstre_kesim_gunu.toString())
      setSonOdemeGunu(mevcutKart.son_odeme_gunu.toString())
      setLimit(mevcutKart.limit?.toString() || '')
      setDonemBorcu(mevcutKart.donem_borcu?.toString() || '')
      setDonemIciHarcama(mevcutKart.donem_ici_harcama?.toString() || '')
      setAsgariOdemeOrani(mevcutKart.asgari_odeme_orani?.toString() || '20')
      setFaizOrani(mevcutKart.faiz_orani?.toString() || '2.5')
    } else {
      setAd('')
      setEkstreKesimGunu('15')
      setSonOdemeGunu('10')
      setLimit('')
      setDonemBorcu('')
      setDonemIciHarcama('')
      setAsgariOdemeOrani('20')
      setFaizOrani('2.5')
    }
  }, [mevcutKart, isOpen])

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

    const donemBorcuTutar = donemBorcu ? parseTutar(donemBorcu) : 0
    const donemIciTutar = donemIciHarcama ? parseTutar(donemIciHarcama) : 0

    const kartVerisi: KrediKarti = {
      id: mevcutKart
        ? mevcutKart.id
        : Math.max(...(veriler.kredi_kartlari?.map((kk) => kk.id) || [0]), 0) + 1,
      ad: ad.trim(),
      ekstre_kesim_gunu: ekstreGun,
      son_odeme_gunu: odemeGun,
      limit: limit ? parseFloat(limit.replace(/\./g, '').replace(/,/g, '')) : undefined,
      donem_borcu: donemBorcuTutar > 0 ? donemBorcuTutar : undefined,
      donem_ici_harcama: donemIciTutar > 0 ? donemIciTutar : undefined,
      asgari_odeme_orani: asgariOdemeOrani ? parseFloat(asgariOdemeOrani.replace(',', '.')) : undefined,
      faiz_orani: faizOrani ? parseFloat(faizOrani.replace(',', '.')) : undefined,
      // Mevcut taksit verileri korunur (edit modunda)
      taksit_planlari: mevcutKart?.taksit_planlari,
      odeme_plani: mevcutKart?.odeme_plani,
      taksitler: mevcutKart?.taksitler,
      bakiye: 0, // hesaplaBakiye ile üzerine yazılacak
    }

    kartVerisi.bakiye = hesaplaBakiye(kartVerisi)

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      kredi_kartlari: mevcutKart
        ? (veriler.kredi_kartlari || []).map((kk) =>
            kk.id === mevcutKart.id ? kartVerisi : kk
          )
        : [...(veriler.kredi_kartlari || []), kartVerisi],
    }

    onSave(yeniVeriler)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mevcutKart ? '✏️ Kartı Düzenle' : '💳 Kredi Kartı Ekle'}
      size="md"
    >
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

        <Input
          label="Kart Limiti (TL) - Opsiyonel"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="50000"
        />

        <Input
          label="Ekstre Borcu (TL) - Opsiyonel"
          value={donemBorcu}
          onChange={(e) => setDonemBorcu(e.target.value)}
          placeholder="Kilitli ekstre — gelecek son ödeme gününde ödenecek"
        />

        <Input
          label="Dönem İçi Harcama (TL) - Opsiyonel"
          value={donemIciHarcama}
          onChange={(e) => setDonemIciHarcama(e.target.value)}
          placeholder="Bu dönem yapılan, henüz ekstre kesilmemiş harcamalar"
        />

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

        <div className="glass rounded-lg p-3 border border-white/10">
          <p className="text-xs text-white/50">
            💡 Taksit planlarını eklemek için kartı kaydettikten sonra <strong className="text-white/70">Kartlar</strong> sayfasından yönetebilirsiniz.
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
