'use client'

import { useState, useEffect } from 'react'
import { addMonths, format } from 'date-fns'
import { Calculator, TrendingUp, AlertCircle, Save } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { krediHesapla, projeksiyonHesapla } from '@/lib/finansal'
import { formatPara, parseTutar } from '@/lib/utils'
import type { FinansalVeriler, KrediHesaplama, ProjeksiyonAyi } from '@/types'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { BorcEkleModal } from '@/components/modals/BorcEkleModal'

export default function KrediSimulasyonPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [tutar, setTutar] = useState('100000')
  const [vade, setVade] = useState('12')
  const [faiz, setFaiz] = useState('2.5')
  const [tarih, setTarih] = useState(format(addMonths(new Date(), 1), 'dd.MM.yyyy'))
  const [kredi, setKredi] = useState<KrediHesaplama | null>(null)
  const [projeksiyon, setProjeksiyon] = useState<ProjeksiyonAyi[]>([])
  const [kaydetModalOpen, setKaydetModalOpen] = useState(false)

  useEffect(() => {
    setVeriler(loadData())
  }, [])

  const handleHesapla = () => {
    const parsedTutar = parseTutar(tutar)
    const parsedVade = parseInt(vade)
    const parsedFaiz = parseFloat(faiz.replace(',', '.'))

    if (isNaN(parsedTutar) || parsedTutar <= 0 || isNaN(parsedVade) || parsedVade <= 0) {
      alert('Lütfen geçerli değerler girin!')
      return
    }

    if (parsedVade > 120) {
      alert('Vade en fazla 120 ay olabilir!')
      return
    }

    try {
      const tarihTest = new Date(tarih.split('.').reverse().join('-'))
      if (isNaN(tarihTest.getTime())) {
        alert('Geçerli bir tarih girin! (GG.AA.YYYY)')
        return
      }
    } catch {
      alert('Geçerli bir tarih girin! (GG.AA.YYYY)')
      return
    }

    const hesaplananKredi = krediHesapla(parsedTutar, parsedVade, parsedFaiz)
    setKredi(hesaplananKredi)

    if (veriler) {
      const proj = projeksiyonHesapla(veriler, {
        vade: parsedVade,
        aylik_taksit: hesaplananKredi.aylik_taksit,
        ilk_taksit_tarihi: tarih,
      })
      setProjeksiyon(proj)
    }
  }

  const handleKaydet = () => {
    if (!veriler || !kredi) return
    setKaydetModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
            Kredi Simülasyonu
          </h1>
          <p className="text-xs sm:text-sm text-white/60">Kredi hesaplamalarınızı yapın ve projeksiyon görün</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Form */}
          <Card className="premium-card p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Kredi Bilgileri</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Input
                label="Kredi Tutarı (TL)"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="100000"
                type="number"
              />
              <Input
                label="Vade (Ay)"
                type="number"
                value={vade}
                onChange={(e) => setVade(e.target.value)}
                placeholder="12"
                min="1"
                max="120"
              />
              <Input
                label="Aylık Faiz Oranı (%)"
                value={faiz}
                onChange={(e) => setFaiz(e.target.value)}
                placeholder="2.5"
                type="number"
                step="0.1"
              />
              <Input
                label="İlk Taksit Tarihi (GG.AA.YYYY)"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                placeholder="01.01.2024"
              />
              <Button onClick={handleHesapla} variant="primary" className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Hesapla
              </Button>
            </div>
          </Card>

          {/* Sonuçlar */}
          <Card className="premium-card p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">Hesaplama Sonuçları</h2>
            </div>
            {kredi ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="glass rounded-lg sm:rounded-xl p-4 sm:p-5 border border-white/10">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-white/60">Aylık Taksit</span>
                      <span className="text-warning font-bold text-lg sm:text-xl truncate ml-2">
                        {formatPara(kredi.aylik_taksit)}
                      </span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-white/60">Toplam Geri Ödeme</span>
                      <span className="text-info font-bold text-lg sm:text-xl truncate ml-2">
                        {formatPara(kredi.toplam_odeme)}
                      </span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-white/60">Toplam Faiz</span>
                      <span className="text-danger font-bold text-lg sm:text-xl truncate ml-2">
                        {formatPara(kredi.toplam_faiz)}
                      </span>
                    </div>
                  </div>
                </div>

                {projeksiyon.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-bold text-white">12 Aylık Projeksiyon</h3>
                      <Button
                        onClick={handleKaydet}
                        variant="success"
                        size="sm"
                        className="flex items-center justify-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Kaydet
                      </Button>
                    </div>
                    <div className="glass rounded-lg border border-white/10 overflow-hidden">
                      <div className="overflow-x-auto max-h-64 sm:max-h-96 -mx-4 sm:-mx-6 px-4 sm:px-6">
                        <table className="w-full text-xs sm:text-sm min-w-[600px]">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="text-left p-1.5 sm:p-2 text-white/80 font-medium">Ay</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium hidden sm:table-cell">Başlangıç</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium">Gelir</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium">Gider</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium">Kredi</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium">Net</th>
                              <th className="text-right p-1.5 sm:p-2 text-white/80 font-medium">Bitiş</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projeksiyon.slice(0, 12).map((ay, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-1.5 sm:p-2 text-white/90">{ay.ay}</td>
                                <td className="p-1.5 sm:p-2 text-right text-white/60 hidden sm:table-cell">
                                  {formatPara(ay.baslangic)}
                                </td>
                                <td className="p-1.5 sm:p-2 text-right text-success font-medium">
                                  {ay.gelir > 0 ? formatPara(ay.gelir) : '-'}
                                </td>
                                <td className="p-1.5 sm:p-2 text-right text-danger font-medium">
                                  {ay.gider > 0 ? formatPara(ay.gider) : '-'}
                                </td>
                                <td className="p-1.5 sm:p-2 text-right text-warning font-bold">
                                  {ay.kredi_taksit > 0 ? formatPara(ay.kredi_taksit) : '-'}
                                </td>
                                <td
                                  className={`p-1.5 sm:p-2 text-right font-bold ${
                                    ay.net_fark >= 0 ? 'text-success' : 'text-danger'
                                  }`}
                                >
                                  {ay.net_fark >= 0 ? '+' : ''}
                                  {formatPara(ay.net_fark)}
                                </td>
                                <td
                                  className={`p-1.5 sm:p-2 text-right font-bold ${
                                    ay.bitis >= 0 ? 'text-success' : 'text-danger'
                                  }`}
                                >
                                  {formatPara(ay.bitis)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" />
                </div>
                <p className="text-white/60 text-xs sm:text-sm mb-1 sm:mb-2">Kredi bilgilerini girin</p>
                <p className="text-white/40 text-[10px] sm:text-xs">ve hesapla butonuna tıklayın</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {veriler && kredi && (
        <KrediKaydetModal
          isOpen={kaydetModalOpen}
          onClose={() => setKaydetModalOpen(false)}
          veriler={veriler}
          tutar={parseTutar(tutar)}
          vade={parseInt(vade)}
          aylikTaksit={kredi.aylik_taksit}
          ilkTaksitTarihi={tarih}
          onSave={(yeniVeriler) => {
            saveData(yeniVeriler)
            setVeriler(yeniVeriler)
            setKaydetModalOpen(false)
            alert('✅ Kredi borçlarınıza eklendi!')
          }}
        />
      )}
    </div>
  )
}

function KrediKaydetModal({
  isOpen,
  onClose,
  veriler,
  tutar,
  vade,
  aylikTaksit,
  ilkTaksitTarihi,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  veriler: FinansalVeriler
  tutar: number
  vade: number
  aylikTaksit: number
  ilkTaksitTarihi: string
  onSave: (veriler: FinansalVeriler) => void
}) {
  const [aciklama, setAciklama] = useState(`Kredi - ${formatPara(tutar)}`)

  const handleKaydet = () => {
    if (!aciklama.trim()) {
      alert('Lütfen bir açıklama girin!')
      return
    }

    if (
      !confirm(
        `Bu krediyi borçlarınıza eklemek istediğinize emin misiniz?\n\nAçıklama: ${aciklama}\nTutar: ${formatPara(tutar)}\nVade: ${vade} ay\nAylık: ${formatPara(aylikTaksit)}\nİlk Taksit: ${ilkTaksitTarihi}`
      )
    ) {
      return
    }

    const basTarih = new Date(ilkTaksitTarihi.split('.').reverse().join('-'))
    const taksitler = Array.from({ length: vade }, (_, i) => ({
      tutar: aylikTaksit,
      vade_tarihi: format(addMonths(basTarih, i), 'dd.MM.yyyy'),
      odendi: false,
    }))

    const yeniId = Math.max(...veriler.borclar.map((b) => b.id), 0) + 1

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      borclar: [
        ...veriler.borclar,
        {
          id: yeniId,
          aciklama: aciklama.trim(),
          toplam: tutar,
          aylik: aylikTaksit,
          taksitler,
        },
      ],
    }

    saveData(yeniVeriler)
    onSave(yeniVeriler)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kredi Kaydet" size="sm">
      <div className="space-y-4">
        <div className="glass rounded-lg p-4 border border-white/10 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Tutar:</span>
              <span className="text-white font-medium">{formatPara(tutar)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Vade:</span>
              <span className="text-white font-medium">{vade} ay</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Aylık Taksit:</span>
              <span className="text-white font-medium">{formatPara(aylikTaksit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">İlk Taksit:</span>
              <span className="text-white font-medium">{ilkTaksitTarihi}</span>
            </div>
          </div>
        </div>

        <Input
          label="Borç Açıklaması"
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="Kredi açıklaması"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button variant="success" onClick={handleKaydet} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  )
}
