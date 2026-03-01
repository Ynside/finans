'use client'

import { useState } from 'react'
import { format, addMonths } from 'date-fns'
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Wallet,
  CreditCard,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPara, parseTutar } from '@/lib/utils'
import type { FinansalVeriler, Borc, KrediKarti } from '@/types'

interface OnboardingWizardProps {
  onTamamla: (veriler: FinansalVeriler) => void
}

type BorcForm = {
  id: number
  aciklama: string
  toplam: string
  taksitSayisi: string
  ilkTaksitTarihi: string
}

type KartForm = {
  id: number
  ad: string
  ekstreKesimGunu: string
  sonOdemeGunu: string
  limit: string
  bakiye: string
}

const ADIMLAR = [
  { baslik: 'Hoş Geldiniz' },
  { baslik: 'Nakit & Maaş' },
  { baslik: 'Borçlar' },
  { baslik: 'Kredi Kartları' },
  { baslik: 'Hazır!' },
]

export function OnboardingWizard({ onTamamla }: OnboardingWizardProps) {
  const [adim, setAdim] = useState(0)

  // Adım 1 — Nakit & Maaş
  const [nakitBakiye, setNakitBakiye] = useState('')
  const [maasTutar, setMaasTutar] = useState('')
  const [maasGun, setMaasGun] = useState('1')

  // Adım 2 — Borçlar
  const [borclar, setBorclar] = useState<BorcForm[]>([])
  const [borcForm, setBorcForm] = useState<Omit<BorcForm, 'id'>>({
    aciklama: '',
    toplam: '',
    taksitSayisi: '',
    ilkTaksitTarihi: format(new Date(), 'dd.MM.yyyy'),
  })
  const [borcAcik, setBorcAcik] = useState(false)
  const [borcHata, setBorcHata] = useState('')

  // Adım 3 — Kredi Kartları
  const [kartlar, setKartlar] = useState<KartForm[]>([])
  const [kartForm, setKartForm] = useState<Omit<KartForm, 'id'>>({
    ad: '',
    ekstreKesimGunu: '25',
    sonOdemeGunu: '10',
    limit: '',
    bakiye: '',
  })
  const [kartAcik, setKartAcik] = useState(false)
  const [kartHata, setKartHata] = useState('')

  const ileri = () => setAdim((a) => Math.min(a + 1, ADIMLAR.length - 1))
  const geri = () => setAdim((a) => Math.max(a - 1, 0))

  const borcEkle = () => {
    setBorcHata('')
    if (!borcForm.aciklama.trim()) { setBorcHata('Açıklama gerekli'); return }
    if (!parseTutar(borcForm.toplam)) { setBorcHata('Geçerli tutar girin'); return }
    if (!parseInt(borcForm.taksitSayisi)) { setBorcHata('Geçerli taksit sayısı girin'); return }
    setBorclar((prev) => [...prev, { id: Date.now(), ...borcForm }])
    setBorcForm({ aciklama: '', toplam: '', taksitSayisi: '', ilkTaksitTarihi: format(new Date(), 'dd.MM.yyyy') })
    setBorcAcik(false)
  }

  const kartEkle = () => {
    setKartHata('')
    if (!kartForm.ad.trim()) { setKartHata('Kart adı gerekli'); return }
    const g = parseInt(kartForm.ekstreKesimGunu)
    if (!g || g < 1 || g > 31) { setKartHata('Ekstre günü 1-31 arası olmalı'); return }
    setKartlar((prev) => [...prev, { id: Date.now(), ...kartForm }])
    setKartForm({ ad: '', ekstreKesimGunu: '25', sonOdemeGunu: '10', limit: '', bakiye: '' })
    setKartAcik(false)
  }

  const tamamla = () => {
    const yapilmisBorclar: Borc[] = borclar.map((b, idx) => {
      const toplam = parseTutar(b.toplam)
      const taksitSayisi = parseInt(b.taksitSayisi) || 1
      const aylik = toplam / taksitSayisi
      const basTarih = new Date(b.ilkTaksitTarihi.split('.').reverse().join('-'))
      return {
        id: idx + 1,
        aciklama: b.aciklama,
        toplam,
        aylik,
        taksitler: Array.from({ length: taksitSayisi }, (_, i) => ({
          tutar: aylik,
          vade_tarihi: format(addMonths(basTarih, i), 'dd.MM.yyyy'),
          odendi: false,
        })),
      }
    })

    const yapilmisKartlar: KrediKarti[] = kartlar.map((k, idx) => ({
      id: idx + 1,
      ad: k.ad,
      ekstre_kesim_gunu: parseInt(k.ekstreKesimGunu) || 25,
      son_odeme_gunu: parseInt(k.sonOdemeGunu) || 10,
      limit: parseTutar(k.limit) || undefined,
      bakiye: parseTutar(k.bakiye) || 0,
    }))

    const yeniVeriler: FinansalVeriler = {
      nakit_bakiye: parseTutar(nakitBakiye) || 0,
      borclar: yapilmisBorclar,
      maas: { tutar: parseTutar(maasTutar) || 0, gun: parseInt(maasGun) || 1 },
      son_maas_tarihi: null,
      odeme_gecmisi: [],
      hedefler: [],
      harcamalar: [],
      kredi_kartlari: yapilmisKartlar,
      ek_gelirler: [],
    }

    onTamamla(yeniVeriler)
  }

  return (
    <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg py-8">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ADIMLAR.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === adim ? 'w-10 bg-primary' : i < adim ? 'w-5 bg-primary/50' : 'w-5 bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Kart */}
        <div className="glass-strong rounded-2xl border border-white/10 p-6 sm:p-8">

          {/* ── Adım 0: Hoş Geldiniz ── */}
          {adim === 0 && (
            <div className="text-center py-2">
              <div className="text-6xl mb-6">💰</div>
              <h1 className="text-3xl font-bold gradient-text mb-3">Finansal Takip</h1>
              <p className="text-white/70 mb-2 text-base">Merhaba! Uygulamayı birlikte kuralım.</p>
              <p className="text-white/45 text-sm mb-10 leading-relaxed">
                Maaşını, borçlarını ve kredi kartlarını birkaç adımda giriyorsun.
                Kurulumu tamamladıktan sonra güncellemelerde verilerini kaybetmeyeceksin.
              </p>
              <Button onClick={ileri} variant="primary" className="w-full py-3 text-base">
                Hadi Başlayalım <ChevronRight className="inline w-5 h-5 ml-1" />
              </Button>
              <p className="text-white/25 text-xs mt-4">Her adımı boş bırakıp atlayabilirsin</p>
            </div>
          )}

          {/* ── Adım 1: Nakit & Maaş ── */}
          {adim === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Nakit & Maaş</h2>
                  <p className="text-white/45 text-sm">Şu anki finansal durumun</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input
                  label="Toplam nakit / hesap bakiyesi (TL)"
                  value={nakitBakiye}
                  onChange={(e) => setNakitBakiye(e.target.value)}
                  placeholder="Tüm hesaplarının toplamı — örn: 50000"
                  type="number"
                />
                <Input
                  label="Aylık maaş (TL)"
                  value={maasTutar}
                  onChange={(e) => setMaasTutar(e.target.value)}
                  placeholder="Örn: 40000"
                  type="number"
                />
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Maaş ödeme günü (1-31)
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
              </div>
            </div>
          )}

          {/* ── Adım 2: Borçlar ── */}
          {adim === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-danger/20">
                  <TrendingDown className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Borçlar</h2>
                  <p className="text-white/45 text-sm">Kredi, taksit — aktif olanları gir</p>
                </div>
              </div>

              {/* Liste */}
              {borclar.length > 0 && (
                <div className="space-y-2 mb-4 max-h-44 overflow-y-auto pr-1">
                  {borclar.map((b) => (
                    <div key={b.id} className="flex items-center justify-between glass rounded-lg px-3 py-2.5 border border-white/10">
                      <div>
                        <p className="text-sm font-semibold text-white">{b.aciklama}</p>
                        <p className="text-xs text-white/45">
                          {formatPara(parseTutar(b.toplam))} • {b.taksitSayisi} taksit
                        </p>
                      </div>
                      <button
                        onClick={() => setBorclar((p) => p.filter((x) => x.id !== b.id))}
                        className="text-white/30 hover:text-danger transition-colors p-1 ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form */}
              {borcAcik ? (
                <div className="glass rounded-xl p-4 border border-primary/30 space-y-3">
                  <Input
                    label="Açıklama"
                    value={borcForm.aciklama}
                    onChange={(e) => setBorcForm((p) => ({ ...p, aciklama: e.target.value }))}
                    placeholder="Ziraat Bankası Kredisi"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Toplam Tutar (TL)"
                      value={borcForm.toplam}
                      onChange={(e) => setBorcForm((p) => ({ ...p, toplam: e.target.value }))}
                      placeholder="100000"
                      type="number"
                    />
                    <Input
                      label="Taksit Sayısı"
                      value={borcForm.taksitSayisi}
                      onChange={(e) => setBorcForm((p) => ({ ...p, taksitSayisi: e.target.value }))}
                      placeholder="12"
                      type="number"
                    />
                  </div>
                  <Input
                    label="İlk Taksit Tarihi (GG.AA.YYYY)"
                    value={borcForm.ilkTaksitTarihi}
                    onChange={(e) => setBorcForm((p) => ({ ...p, ilkTaksitTarihi: e.target.value }))}
                    placeholder="01.03.2026"
                  />
                  {borcHata && <p className="text-danger text-xs">{borcHata}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" onClick={() => { setBorcAcik(false); setBorcHata('') }} className="flex-1 text-sm">
                      İptal
                    </Button>
                    <Button variant="primary" onClick={borcEkle} className="flex-1 text-sm">
                      Ekle
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBorcAcik(true)}
                  className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Borç Ekle
                </button>
              )}

              {borclar.length === 0 && !borcAcik && (
                <p className="text-center text-white/25 text-xs mt-3">Borcun yoksa boş geçebilirsin</p>
              )}
            </div>
          )}

          {/* ── Adım 3: Kredi Kartları ── */}
          {adim === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-warning/20">
                  <CreditCard className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Kredi Kartları</h2>
                  <p className="text-white/45 text-sm">Tüm kartlarını tanımla</p>
                </div>
              </div>

              {/* Liste */}
              {kartlar.length > 0 && (
                <div className="space-y-2 mb-4 max-h-44 overflow-y-auto pr-1">
                  {kartlar.map((k) => (
                    <div key={k.id} className="flex items-center justify-between glass rounded-lg px-3 py-2.5 border border-white/10">
                      <div>
                        <p className="text-sm font-semibold text-white">{k.ad}</p>
                        <p className="text-xs text-white/45">
                          Ekstre: {k.ekstreKesimGunu}. gün
                          {parseTutar(k.bakiye) > 0 && ` • Borç: ${formatPara(parseTutar(k.bakiye))}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setKartlar((p) => p.filter((x) => x.id !== k.id))}
                        className="text-white/30 hover:text-danger transition-colors p-1 ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form */}
              {kartAcik ? (
                <div className="glass rounded-xl p-4 border border-primary/30 space-y-3">
                  <Input
                    label="Kart Adı"
                    value={kartForm.ad}
                    onChange={(e) => setKartForm((p) => ({ ...p, ad: e.target.value }))}
                    placeholder="Garanti BBVA Visa"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Ekstre Kesim Günü"
                      value={kartForm.ekstreKesimGunu}
                      onChange={(e) => setKartForm((p) => ({ ...p, ekstreKesimGunu: e.target.value }))}
                      type="number"
                      min="1"
                      max="31"
                    />
                    <Input
                      label="Son Ödeme (gün sonra)"
                      value={kartForm.sonOdemeGunu}
                      onChange={(e) => setKartForm((p) => ({ ...p, sonOdemeGunu: e.target.value }))}
                      type="number"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Limit (TL, opsiyonel)"
                      value={kartForm.limit}
                      onChange={(e) => setKartForm((p) => ({ ...p, limit: e.target.value }))}
                      type="number"
                      placeholder="50000"
                    />
                    <Input
                      label="Mevcut Borç (TL)"
                      value={kartForm.bakiye}
                      onChange={(e) => setKartForm((p) => ({ ...p, bakiye: e.target.value }))}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  {kartHata && <p className="text-danger text-xs">{kartHata}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" onClick={() => { setKartAcik(false); setKartHata('') }} className="flex-1 text-sm">
                      İptal
                    </Button>
                    <Button variant="primary" onClick={kartEkle} className="flex-1 text-sm">
                      Ekle
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setKartAcik(true)}
                  className="w-full py-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Kart Ekle
                </button>
              )}

              {kartlar.length === 0 && !kartAcik && (
                <p className="text-center text-white/25 text-xs mt-3">Kredi kartın yoksa boş geçebilirsin</p>
              )}
            </div>
          )}

          {/* ── Adım 4: Özet & Tamamla ── */}
          {adim === 4 && (
            <div className="text-center py-2">
              <div className="text-5xl mb-5">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-5">Her Şey Hazır!</h2>

              <div className="glass rounded-xl border border-white/10 divide-y divide-white/10 text-left mb-6">
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-white/55">Bakiye</span>
                  <span className="text-white font-semibold">
                    {parseTutar(nakitBakiye) ? formatPara(parseTutar(nakitBakiye)) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-white/55">Maaş</span>
                  <span className="text-white font-semibold">
                    {parseTutar(maasTutar)
                      ? `${formatPara(parseTutar(maasTutar))} · her ayın ${maasGun}. günü`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-white/55">Borçlar</span>
                  <span className="text-white font-semibold">
                    {borclar.length > 0 ? `${borclar.length} borç eklendi` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-white/55">Kredi Kartları</span>
                  <span className="text-white font-semibold">
                    {kartlar.length > 0 ? `${kartlar.length} kart eklendi` : '—'}
                  </span>
                </div>
              </div>

              <Button onClick={tamamla} variant="success" className="w-full py-3 text-base">
                <CheckCircle2 className="inline w-5 h-5 mr-2" />
                Uygulamayı Kullanmaya Başla
              </Button>
              <p className="text-white/25 text-xs mt-3">
                Dilediğin zaman Ayarlar'dan düzenleyebilirsin
              </p>
            </div>
          )}

          {/* Navigasyon butonları */}
          {adim > 0 && adim < 4 && (
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={geri} className="flex-1">
                <ChevronLeft className="inline w-4 h-4 mr-1" /> Geri
              </Button>
              <Button variant="primary" onClick={ileri} className="flex-1">
                {adim === 3 ? 'Özete Git' : 'İleri'} <ChevronRight className="inline w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
