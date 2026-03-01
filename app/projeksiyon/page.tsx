'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Download, AlertCircle } from 'lucide-react'
import { loadData } from '@/lib/storage'
import { projeksiyonHesapla } from '@/lib/finansal'
import { formatPara } from '@/lib/utils'
import type { FinansalVeriler, ProjeksiyonAyi } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { exportToPDF } from '@/lib/pdf'

export default function ProjeksiyonPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)
  const [projeksiyon, setProjeksiyon] = useState<ProjeksiyonAyi[]>([])

  useEffect(() => {
    const data = loadData()
    setVeriler(data)
    setProjeksiyon(projeksiyonHesapla(data))
  }, [])

  if (!veriler) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white/60 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  const toplamGelir = projeksiyon.reduce((sum, p) => sum + p.gelir, 0)
  const toplamGider = projeksiyon.reduce((sum, p) => sum + p.gider, 0)
  const sonBakiye = projeksiyon[projeksiyon.length - 1]?.bitis || 0
  const ilkBakiye = projeksiyon[0]?.baslangic || 0

  const handleExport = () => {
    exportToPDF(veriler)
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
                12 Aylık Projeksiyon
              </h1>
              <p className="text-xs sm:text-sm text-white/60">Gelecek 12 ay için finansal tahminleriniz</p>
            </div>
            <Button onClick={handleExport} variant="secondary" className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3">
              <Download className="w-4 h-4" />
              <span>PDF İndir</span>
            </Button>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Gelir</div>
            </div>
            <div className="text-base sm:text-lg md:text-2xl font-bold text-success mb-0.5 sm:mb-1 truncate">{formatPara(toplamGelir)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">12 ay toplam</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-danger/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Gider</div>
            </div>
            <div className="text-base sm:text-lg md:text-2xl font-bold text-danger mb-0.5 sm:mb-1 truncate">{formatPara(toplamGider)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">12 ay toplam</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Net</div>
            </div>
            <div className={`text-base sm:text-lg md:text-2xl font-bold mb-0.5 sm:mb-1 truncate ${toplamGelir - toplamGider >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPara(toplamGelir - toplamGider)}
            </div>
            <div className="text-[10px] sm:text-xs text-white/40">12 ay sonrası</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Bakiye</div>
            </div>
            <div className={`text-base sm:text-lg md:text-2xl font-bold mb-0.5 sm:mb-1 truncate ${sonBakiye >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPara(sonBakiye)}
            </div>
            <div className="text-[10px] sm:text-xs text-white/40">12 ay sonunda</div>
          </Card>
        </div>

        {/* Projeksiyon Tablosu - Desktop */}
        <Card className="premium-card p-3 sm:p-4 md:p-6 hidden md:block">
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 scrollbar-hide">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider">Ay</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider hidden sm:table-cell">Başlangıç</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider">Gelir</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider">Gider</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider">Net</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase tracking-wider">Bitiş</th>
                </tr>
              </thead>
              <tbody>
                {projeksiyon.map((ay, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm font-medium text-white">{ay.ay}</td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right text-white/60 hidden sm:table-cell">
                      {formatPara(ay.baslangic)}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-semibold text-success">
                      {ay.gelir > 0 ? formatPara(ay.gelir) : '-'}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-semibold text-danger">
                      {ay.gider > 0 ? formatPara(ay.gider) : '-'}
                    </td>
                    <td
                      className={`p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-bold ${
                        ay.net_fark >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {ay.net_fark >= 0 ? '+' : ''}
                      {formatPara(ay.net_fark)}
                    </td>
                    <td
                      className={`p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-bold ${
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
        </Card>

        {/* Projeksiyon Kartları - Mobile */}
        <div className="md:hidden space-y-3">
          {projeksiyon.map((ay, idx) => (
            <Card key={idx} className="premium-card p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">{ay.ay}</h3>
                <div className="text-right">
                  <p className="text-[10px] text-white/60 mb-0.5">Başlangıç</p>
                  <p className="text-xs text-white/80">{formatPara(ay.baslangic)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] text-white/60 mb-1">Gelir</p>
                  <p className="text-sm font-semibold text-success">
                    {ay.gelir > 0 ? formatPara(ay.gelir) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 mb-1">Gider</p>
                  <p className="text-sm font-semibold text-danger">
                    {ay.gider > 0 ? formatPara(ay.gider) : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-white/60 mb-1">Net Fark</p>
                  <p
                    className={`text-base font-bold ${
                      ay.net_fark >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {ay.net_fark >= 0 ? '+' : ''}
                    {formatPara(ay.net_fark)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 mb-1">Bitiş Bakiye</p>
                  <p
                    className={`text-base font-bold ${
                      ay.bitis >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {formatPara(ay.bitis)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
