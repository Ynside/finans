'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatPara, parseTutar } from '@/lib/utils'
import type { FinansalVeriler, KrediKarti } from '@/types'

interface KrediKartiOdemeModalProps {
  isOpen: boolean
  onClose: () => void
  krediKarti: KrediKarti
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
}

export function KrediKartiOdemeModal({
  isOpen,
  onClose,
  krediKarti,
  veriler,
  onSave,
}: KrediKartiOdemeModalProps) {
  const [odemeTipi, setOdemeTipi] = useState<'tamamini' | 'asgari' | 'ozel'>('tamamini')
  const [tutar, setTutar] = useState('')
  const [faizOrani, setFaizOrani] = useState(krediKarti.faiz_orani?.toString() || '2.5')

  // Asgari ödeme hesapla
  const asgariOdemeOrani = krediKarti.asgari_odeme_orani || 20 // Varsayılan %20
  const asgariOdeme = Math.max(
    (krediKarti.bakiye * asgariOdemeOrani) / 100,
    50 // Minimum 50 TL
  )

  useEffect(() => {
    if (odemeTipi === 'tamamini') {
      setTutar(krediKarti.bakiye.toString())
    } else if (odemeTipi === 'asgari') {
      setTutar(asgariOdeme.toFixed(2))
    }
  }, [odemeTipi, krediKarti.bakiye, asgariOdeme])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const odenecekTutar = parseTutar(tutar)

    if (odenecekTutar <= 0) {
      alert('Geçerli bir tutar girin!')
      return
    }

    if (odenecekTutar > krediKarti.bakiye) {
      alert('Ödeme tutarı bakiyeden fazla olamaz!')
      return
    }

    if (odenecekTutar > veriler.nakit_bakiye) {
      alert('Yetersiz nakit bakiye!')
      return
    }

    // Asgari ödeme yapılıyorsa ve kalan tutar varsa faiz oranı kontrolü
    if (odemeTipi === 'asgari' && odenecekTutar < krediKarti.bakiye) {
      const kalanTutar = krediKarti.bakiye - odenecekTutar
      const parsedFaiz = parseFloat(faizOrani.replace(',', '.'))

      if (isNaN(parsedFaiz) || parsedFaiz < 0) {
        alert('Geçerli bir faiz oranı girin!')
        return
      }

      const faizTutari = (kalanTutar * parsedFaiz) / 100

      if (
        !confirm(
          `Asgari ödeme yapılacak:\n\n` +
          `Ödenecek: ${formatPara(odenecekTutar)}\n` +
          `Kalan Bakiye: ${formatPara(kalanTutar)}\n` +
          `Faiz Oranı: %${parsedFaiz.toFixed(2)}\n` +
          `Eklenecek Faiz: ${formatPara(faizTutari)}\n` +
          `Yeni Bakiye: ${formatPara(kalanTutar + faizTutari)}\n\n` +
          `Devam etmek istiyor musunuz?`
        )
      ) {
        return
      }

      // Asgari ödeme yapıldı, kalan tutara faiz ekle
      const yeniVeriler: FinansalVeriler = {
        ...veriler,
        nakit_bakiye: veriler.nakit_bakiye - odenecekTutar,
        kredi_kartlari: veriler.kredi_kartlari?.map((kk) =>
          kk.id === krediKarti.id
            ? {
                ...kk,
                bakiye: kalanTutar + faizTutari,
                faiz_orani: parsedFaiz, // Faiz oranını kaydet
              }
            : kk
        ),
      }

      onSave(yeniVeriler)
      setTutar('')
      setOdemeTipi('tamamini')
      onClose()
      return
    }

    // Tam ödeme veya özel tutar
    if (
      !confirm(
        `${formatPara(odenecekTutar)} kredi kartı bakiyesini ödemek istediğinize emin misiniz?\n\n⚠️ Bu tutar nakit bakiyenizden düşülecektir.`
      )
    ) {
      return
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye - odenecekTutar,
      kredi_kartlari: veriler.kredi_kartlari?.map((kk) =>
        kk.id === krediKarti.id ? { ...kk, bakiye: kk.bakiye - odenecekTutar } : kk
      ),
    }

    onSave(yeniVeriler)
    setTutar('')
    setOdemeTipi('tamamini')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`💳 ${krediKarti.ad} - Ödeme`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass rounded-xl p-4 mb-4">
          <p className="text-sm text-white/60 mb-1">Ödenmemiş Bakiye</p>
          <p className="text-2xl font-bold text-danger">{formatPara(krediKarti.bakiye)}</p>
          <p className="text-sm text-white/60 mt-2">Mevcut Nakit: {formatPara(veriler.nakit_bakiye)}</p>
          {krediKarti.asgari_odeme_orani && (
            <p className="text-xs text-warning mt-1">
              Asgari Ödeme: {formatPara(asgariOdeme)} (%{asgariOdemeOrani})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/80 mb-3">Ödeme Tipi</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOdemeTipi('tamamini')}
              className={`p-3 rounded-xl border-2 transition-all text-sm ${
                odemeTipi === 'tamamini'
                  ? 'border-primary bg-primary/20'
                  : 'border-white/10 glass hover:border-white/20'
              }`}
            >
              <p className="font-semibold text-white">Tamamı</p>
              <p className="text-xs text-white/60 mt-1">{formatPara(krediKarti.bakiye)}</p>
            </button>
            <button
              type="button"
              onClick={() => setOdemeTipi('asgari')}
              className={`p-3 rounded-xl border-2 transition-all text-sm ${
                odemeTipi === 'asgari'
                  ? 'border-warning bg-warning/20'
                  : 'border-white/10 glass hover:border-white/20'
              }`}
            >
              <p className="font-semibold text-white">Asgari</p>
              <p className="text-xs text-white/60 mt-1">{formatPara(asgariOdeme)}</p>
            </button>
            <button
              type="button"
              onClick={() => setOdemeTipi('ozel')}
              className={`p-3 rounded-xl border-2 transition-all text-sm ${
                odemeTipi === 'ozel'
                  ? 'border-info bg-info/20'
                  : 'border-white/10 glass hover:border-white/20'
              }`}
            >
              <p className="font-semibold text-white">Özel</p>
              <p className="text-xs text-white/60 mt-1">Tutar Gir</p>
            </button>
          </div>
        </div>

        {odemeTipi === 'ozel' && (
          <Input
            label="Ödenecek Tutar (TL)"
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            placeholder={krediKarti.bakiye.toString()}
            required
          />
        )}

        {odemeTipi === 'asgari' && parseTutar(tutar) < krediKarti.bakiye && (
          <div className="glass rounded-lg p-4 border border-warning/30">
            <p className="text-sm text-warning font-semibold mb-2">⚠️ Asgari Ödeme Uyarısı</p>
            <p className="text-xs text-white/70 mb-3">
              Asgari ödeme yapıldıktan sonra kalan tutara faiz eklenecektir.
            </p>
            <Input
              label="Aylık Faiz Oranı (%)"
              value={faizOrani}
              onChange={(e) => setFaizOrani(e.target.value)}
              placeholder="2.5"
              type="number"
              step="0.1"
              required
            />
            <div className="mt-2 text-xs text-white/60">
              <p>Kalan Bakiye: {formatPara(krediKarti.bakiye - asgariOdeme)}</p>
              <p>
                Eklenecek Faiz:{' '}
                {formatPara(((krediKarti.bakiye - asgariOdeme) * parseFloat(faizOrani.replace(',', '.'))) / 100)}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            💰 Öde
          </Button>
        </div>
      </form>
    </Modal>
  )
}
