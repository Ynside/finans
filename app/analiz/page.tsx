'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import { loadData } from '@/lib/storage'
import { formatPara } from '@/lib/utils'
import { kategoriAnaliziYap, aylikOzetHesapla, enCokHarcamaKategorileri } from '@/lib/shared/analytics'
import type { FinansalVeriler } from '@/types'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export default function AnalizPage() {
  const [veriler, setVeriler] = useState<FinansalVeriler | null>(null)

  useEffect(() => {
    setVeriler(loadData())
  }, [])

  if (!veriler) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white/60 text-sm">Yükleniyor...</div>
      </div>
    )
  }

  const kategoriAnalizi = kategoriAnaliziYap(veriler)
  const aylikOzet = aylikOzetHesapla(veriler)
  const enCokHarcama = enCokHarcamaKategorileri(veriler, 5)

  const toplamHarcama = kategoriAnalizi.reduce((sum, k) => sum + k.toplam, 0)

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 gradient-text">
            Harcama Analizi
          </h1>
          <p className="text-xs sm:text-sm text-white/60">Kategori bazlı harcama detaylarınız</p>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-danger/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Toplam Harcama</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-danger mb-0.5 sm:mb-1 truncate">{formatPara(toplamHarcama)}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Tüm kategoriler</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-info/20">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Kategori Sayısı</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-info mb-0.5 sm:mb-1">{kategoriAnalizi.length}</div>
            <div className="text-[10px] sm:text-xs text-white/40">Aktif kategoriler</div>
          </Card>

          <Card className="premium-card p-3 sm:p-4 md:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider hidden sm:block">Ortalama</div>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-0.5 sm:mb-1 truncate">
              {formatPara(kategoriAnalizi.length > 0 ? toplamHarcama / kategoriAnalizi.length : 0)}
            </div>
            <div className="text-[10px] sm:text-xs text-white/40">Kategori başına</div>
          </Card>
        </div>

        {/* Kategori Analizi */}
        <Card className="premium-card mb-4 sm:mb-6 md:mb-8 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20">
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Kategori Bazlı Analiz</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {kategoriAnalizi.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-white/60 text-xs sm:text-sm">Henüz harcama kaydı yok</p>
              </div>
            ) : (
              kategoriAnalizi.map((kategori, idx) => {
                const yuzde = toplamHarcama > 0 ? (kategori.toplam / toplamHarcama) * 100 : 0
                return (
                  <div key={idx} className="glass rounded-lg p-3 sm:p-4 border border-white/10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-bold text-white truncate">{kategori.kategori}</h3>
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-medium">
                            {kategori.adet} adet
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                          <span className="text-white/80">
                            Toplam: <span className="font-bold text-white">{formatPara(kategori.toplam)}</span>
                          </span>
                          <span className="text-white/60">
                            Ortalama: {formatPara(kategori.ortalama)}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-0.5">
                          {yuzde.toFixed(1)}%
                        </div>
                        <div className="text-[10px] sm:text-xs text-white/60">Toplamın %{yuzde.toFixed(1)}'i</div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light transition-all"
                        style={{ width: `${Math.min(yuzde, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Aylık Özet */}
        <Card className="premium-card p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-1.5 sm:p-2 rounded-lg bg-success/20">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Son 6 Ay Özeti</h2>
          </div>

          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase">Ay</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase">Gelir</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase">Gider</th>
                  <th className="text-right p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm font-bold text-white/80 uppercase">Net</th>
                </tr>
              </thead>
              <tbody>
                {aylikOzet.map((ozet, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm font-medium text-white">{ozet.ay}</td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-semibold text-success">
                      {formatPara(ozet.gelir)}
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-semibold text-danger">
                      {formatPara(ozet.gider)}
                    </td>
                    <td
                      className={cn(
                        'p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-right font-bold',
                        ozet.net >= 0 ? 'text-success' : 'text-danger'
                      )}
                    >
                      {ozet.net >= 0 ? '+' : ''}
                      {formatPara(ozet.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

