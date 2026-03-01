'use client'

import { useState } from 'react'
import { addMonths, format } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar } from '@/lib/utils'
import type { FinansalVeriler, Borc } from '@/types'

interface BorcEkleModalProps {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
}

export function BorcEkleModal({ isOpen, onClose, veriler, onSave }: BorcEkleModalProps) {
  const [aciklama, setAciklama] = useState('')
  const [toplam, setToplam] = useState('')
  const [taksitSayisi, setTaksitSayisi] = useState('')
  const [tarih, setTarih] = useState(format(new Date(), 'dd.MM.yyyy'))
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedToplam = parseTutar(toplam)
    const parsedTaksitSayisi = parseInt(taksitSayisi)

    if (!aciklama.trim()) {
      setError('Açıklama gerekli!')
      return
    }

    if (isNaN(parsedToplam) || parsedToplam <= 0) {
      setError('Geçerli bir toplam tutar girin!')
      return
    }

    if (isNaN(parsedTaksitSayisi) || parsedTaksitSayisi <= 0) {
      setError('Geçerli bir taksit sayısı girin!')
      return
    }

    try {
      const basTarih = new Date(tarih.split('.').reverse().join('-'))
      if (isNaN(basTarih.getTime())) {
        setError('Geçerli bir tarih girin! (GG.AA.YYYY)')
        return
      }

      const aylik = parsedToplam / parsedTaksitSayisi
      const yeniId = Math.max(...veriler.borclar.map((b) => b.id), 0) + 1

      const taksitler = Array.from({ length: parsedTaksitSayisi }, (_, i) => ({
        tutar: aylik,
        vade_tarihi: format(addMonths(basTarih, i), 'dd.MM.yyyy'),
        odendi: false,
      }))

      const yeniBorc: Borc = {
        id: yeniId,
        aciklama: aciklama.trim(),
        toplam: parsedToplam,
        aylik,
        taksitler,
      }

      const yeniVeriler: FinansalVeriler = {
        ...veriler,
        borclar: [...veriler.borclar, yeniBorc],
      }

      onSave(yeniVeriler)
      setAciklama('')
      setToplam('')
      setTaksitSayisi('')
      setTarih(format(new Date(), 'dd.MM.yyyy'))
      setError('')
    } catch (err) {
      setError('Tarih formatı hatalı! (GG.AA.YYYY)')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💳 Yeni Borç Ekle" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Açıklama (Banka/Kurum)"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Ziraat Bankası Kredi"
          required
        />

        <Input
          label="Toplam Borç (TL)"
          type="text"
          value={toplam}
          onChange={(e) => setToplam(e.target.value)}
          placeholder="100000"
          required
        />

        <Input
          label="Taksit Sayısı"
          type="number"
          value={taksitSayisi}
          onChange={(e) => setTaksitSayisi(e.target.value)}
          placeholder="12"
          min="1"
          required
        />

        <Input
          label="İlk Taksit Tarihi (GG.AA.YYYY)"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          placeholder="01.01.2024"
          required
        />

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
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





