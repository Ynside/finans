'use client'

import { useState } from 'react'
import { ShoppingCart, CreditCard, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar } from '@/lib/utils'
import { format, addMonths } from 'date-fns'
import { hesaplaBakiye } from '@/lib/kredi-utils'
import type { FinansalVeriler, Harcama, TaksitPlani } from '@/types'

interface HarcamaEkleModalProps {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  onSave: (veriler: FinansalVeriler) => void
}

const kategoriler = [
  'Market',
  'Yemek',
  'Ulaşım',
  'Faturalar',
  'Eğlence',
  'Sağlık',
  'Giyim',
  'Diğer',
]

export function HarcamaEkleModal({ isOpen, onClose, veriler, onSave }: HarcamaEkleModalProps) {
  const [aciklama, setAciklama] = useState('')
  const [tutar, setTutar] = useState('')
  const [tarih, setTarih] = useState(format(new Date(), 'dd.MM.yyyy'))
  const [tip, setTip] = useState<'nakit' | 'kredi_karti'>('nakit')
  const [kategori, setKategori] = useState('Market')
  const [krediKartiId, setKrediKartiId] = useState<number | undefined>(
    veriler.kredi_kartlari?.[0]?.id
  )
  const [taksitlendirme, setTaksitlendirme] = useState(false)
  const [taksitSayisi, setTaksitSayisi] = useState('3')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedTutar = parseTutar(tutar)
    if (parsedTutar <= 0) {
      alert('Lütfen geçerli bir tutar girin!')
      return
    }

    // Taksitlendirme kontrolü
    if (taksitlendirme && tip === 'kredi_karti') {
      const parsedTaksitSayisi = parseInt(taksitSayisi)
      if (isNaN(parsedTaksitSayisi) || parsedTaksitSayisi < 2 || parsedTaksitSayisi > 12) {
        alert('Taksit sayısı 2-12 arası olmalıdır!')
        return
      }
    }

    const yeniId = Math.max(...(veriler.harcamalar?.map((h) => h.id) || [0]), 0) + 1

    // Aylık taksit tutarını hesapla
    const aylikTutar = taksitlendirme && tip === 'kredi_karti'
      ? parsedTutar / parseInt(taksitSayisi)
      : parsedTutar

    const yeniHarcama: Harcama = {
      id: yeniId,
      aciklama: aciklama.trim() || `${kategori} Harcaması`,
      tutar: parsedTutar,
      tarih,
      tip,
      kategori,
      kredi_karti_id: tip === 'kredi_karti' ? krediKartiId : undefined,
      taksitlendirme:
        taksitlendirme && tip === 'kredi_karti'
          ? {
              taksit_sayisi: parseInt(taksitSayisi),
              aylik_tutar: aylikTutar,
              baslangic_tarihi: tarih,
            }
          : undefined,
    }

    let yeniVeriler: FinansalVeriler = {
      ...veriler,
      harcamalar: [...(veriler.harcamalar || []), yeniHarcama],
    }

    // Nakit ise bakiyeden düş
    if (tip === 'nakit') {
      yeniVeriler.nakit_bakiye = veriler.nakit_bakiye - parsedTutar
    } else if (tip === 'kredi_karti' && krediKartiId) {
      if (taksitlendirme) {
        const sonrakiAy = format(addMonths(new Date(), 1), 'yyyy-MM')
        const yeniTaksit: TaksitPlani = {
          id: Date.now(),
          aciklama: (aciklama.trim() || `${kategori} Harcaması`),
          toplam_tutar: parsedTutar,
          toplam_taksit: parseInt(taksitSayisi),
          kalan_taksit: parseInt(taksitSayisi),
          baslangic: sonrakiAy,
          aylik_tutar: Math.round(aylikTutar * 100) / 100,
          harcama_id: yeniId,
        }
        yeniVeriler.kredi_kartlari = veriler.kredi_kartlari?.map((kk) => {
          if (kk.id !== krediKartiId) return kk
          const guncelKart = {
            ...kk,
            taksit_planlari: [...(kk.taksit_planlari || []), yeniTaksit],
          }
          return { ...guncelKart, bakiye: hesaplaBakiye(guncelKart) }
        })
      } else {
        yeniVeriler.kredi_kartlari = veriler.kredi_kartlari?.map((kk) => {
          if (kk.id !== krediKartiId) return kk
          const guncelKart = {
            ...kk,
            donem_ici_harcama: (kk.donem_ici_harcama || 0) + parsedTutar,
          }
          return { ...guncelKart, bakiye: hesaplaBakiye(guncelKart) }
        })
      }
    }

    onSave(yeniVeriler)
    setAciklama('')
    setTutar('')
    setTarih(format(new Date(), 'dd.MM.yyyy'))
    setTip('nakit')
    setKategori('Market')
    setTaksitlendirme(false)
    setTaksitSayisi('3')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Harcama Ekle" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Açıklama (Opsiyonel)"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Örn: Market - Et (Boş bırakılırsa kategori adı kullanılır)"
        />

        <Input
          label="Tutar (TL)"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="2000"
          required
        />

        <Input
          label="Tarih (GG.AA.YYYY)"
          value={tarih}
          onChange={(e) => setTarih(e.target.value)}
          placeholder="01.01.2024"
          required
        />

        <div>
          <label className="block text-sm font-semibold text-white/80 mb-2">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {kategoriler.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white/80 mb-3">Ödeme Tipi</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTip('nakit')
                setTaksitlendirme(false)
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                tip === 'nakit'
                  ? 'border-primary bg-primary/20'
                  : 'border-white/10 glass hover:border-white/20'
              }`}
            >
              <Wallet className="w-6 h-6 mx-auto mb-2 text-white" />
              <p className="font-semibold text-white">Nakit</p>
              <p className="text-xs text-white/60 mt-1">Bakiyeden düşer</p>
            </button>
            <button
              type="button"
              onClick={() => setTip('kredi_karti')}
              className={`p-4 rounded-xl border-2 transition-all ${
                tip === 'kredi_karti'
                  ? 'border-primary bg-primary/20'
                  : 'border-white/10 glass hover:border-white/20'
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2 text-white" />
              <p className="font-semibold text-white">Kredi Kartı</p>
              <p className="text-xs text-white/60 mt-1">Ekstrede görünür</p>
            </button>
          </div>
        </div>

        {tip === 'kredi_karti' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Kredi Kartı</label>
              <select
                value={krediKartiId || ''}
                onChange={(e) => setKrediKartiId(Number(e.target.value))}
                className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required={tip === 'kredi_karti'}
              >
                <option value="">Seçiniz</option>
                {veriler.kredi_kartlari?.map((kk) => (
                  <option key={kk.id} value={kk.id}>
                    {kk.ad} (Bakiye: {kk.bakiye.toFixed(2)} TL)
                  </option>
                ))}
              </select>
              {(!veriler.kredi_kartlari || veriler.kredi_kartlari.length === 0) && (
                <p className="text-sm text-warning mt-2">
                  ⚠️ Önce kredi kartı eklemeniz gerekiyor (Ayarlar)
                </p>
              )}
            </div>

            <div className="glass rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="taksitlendirme"
                  checked={taksitlendirme}
                  onChange={(e) => setTaksitlendirme(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="taksitlendirme" className="text-sm font-semibold text-white">
                  Taksitlendir
                </label>
              </div>

              {taksitlendirme && (
                <div className="space-y-3">
                  <Input
                    label="Taksit Sayısı (2-12)"
                    type="number"
                    min="2"
                    max="12"
                    value={taksitSayisi}
                    onChange={(e) => setTaksitSayisi(e.target.value)}
                    required={taksitlendirme}
                  />
                  {tutar && taksitSayisi && !isNaN(parseTutar(tutar)) && !isNaN(parseInt(taksitSayisi)) && (
                    <div className="glass rounded-lg p-3 bg-primary/10">
                      <p className="text-xs text-white/60 mb-1">Aylık Taksit Tutarı</p>
                      <p className="text-lg font-bold text-primary">
                        {parseTutar(tutar) / parseInt(taksitSayisi) > 0
                          ? (parseTutar(tutar) / parseInt(taksitSayisi)).toFixed(2)
                          : '0.00'}{' '}
                        TL
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Toplam: {parseTutar(tutar).toFixed(2)} TL / {taksitSayisi} ay
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

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
