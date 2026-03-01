/**
 * Analytics ve İstatistik Fonksiyonları
 * Kategori bazlı harcama analizi ve diğer istatistikler
 */

import type { FinansalVeriler, Harcama } from '@/types'

export interface KategoriAnalizi {
  kategori: string
  toplam: number
  adet: number
  ortalama: number
  yuzde: number
}

export interface AylikOzet {
  ay: string
  gelir: number
  gider: number
  net: number
}

/**
 * Kategori bazlı harcama analizi
 */
export function kategoriAnaliziYap(veriler: FinansalVeriler): KategoriAnalizi[] {
  const harcamalar = veriler.harcamalar || []
  
  // Kategorilere göre grupla
  const kategoriMap: Record<string, { toplam: number; adet: number }> = {}
  
  harcamalar.forEach((harcama) => {
    const kategori = harcama.kategori || 'Diğer'
    if (!kategoriMap[kategori]) {
      kategoriMap[kategori] = { toplam: 0, adet: 0 }
    }
    kategoriMap[kategori].toplam += harcama.tutar
    kategoriMap[kategori].adet += 1
  })
  
  // Toplam hesapla
  const toplamHarcama = Object.values(kategoriMap).reduce(
    (sum, item) => sum + item.toplam,
    0
  )
  
  // Sonuçları formatla
  const analizler: KategoriAnalizi[] = Object.entries(kategoriMap).map(
    ([kategori, data]) => ({
      kategori,
      toplam: Math.round(data.toplam * 100) / 100,
      adet: data.adet,
      ortalama: Math.round((data.toplam / data.adet) * 100) / 100,
      yuzde: toplamHarcama > 0 
        ? Math.round((data.toplam / toplamHarcama) * 100 * 100) / 100 
        : 0,
    })
  )
  
  // Toplama göre sırala
  return analizler.sort((a, b) => b.toplam - a.toplam)
}

/**
 * Aylık gelir-gider özeti
 */
export function aylikOzetHesapla(veriler: FinansalVeriler): AylikOzet[] {
  const bugun = new Date()
  const ozetler: AylikOzet[] = []
  
  // Son 6 ay
  for (let i = 5; i >= 0; i--) {
    const tarih = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1)
    const ayKey = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`
    const ayAdi = tarih.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    
    // Bu ayın harcamaları
    const buAyHarcamalar = (veriler.harcamalar || []).filter((h) => {
      try {
        const [gun, ay, yil] = h.tarih.split('.')
        const harcamaAyKey = `${yil}-${ay.padStart(2, '0')}`
        return harcamaAyKey === ayKey
      } catch {
        return false
      }
    })
    
    const gider = buAyHarcamalar.reduce((sum, h) => sum + h.tutar, 0)
    
    // Gelir hesaplama (maaş + ek gelirler)
    let gelir = 0
    
    // Maaş kontrolü
    const [yil, ay] = ayKey.split('-').map(Number)
    const sonMaas = veriler.son_maas_tarihi
    if (sonMaas) {
      const [sonYil, sonAy] = sonMaas.split('-').map(Number)
      if (yil > sonYil || (yil === sonYil && ay > sonAy)) {
        gelir += veriler.maas.tutar
      }
    }
    
    // Ek gelirler
    const ekGelirler = (veriler.ek_gelirler || []).filter((eg) => {
      if (!eg.son_ekleme_tarihi) return true
      const [egYil, egAy] = eg.son_ekleme_tarihi.split('-').map(Number)
      return yil > egYil || (yil === egYil && ay > egAy)
    })
    
    gelir += ekGelirler.reduce((sum, eg) => sum + eg.tutar, 0)
    
    ozetler.push({
      ay: ayAdi,
      gelir: Math.round(gelir * 100) / 100,
      gider: Math.round(gider * 100) / 100,
      net: Math.round((gelir - gider) * 100) / 100,
    })
  }
  
  return ozetler
}

/**
 * En çok harcama yapılan kategoriler
 */
export function enCokHarcamaKategorileri(
  veriler: FinansalVeriler,
  limit: number = 5
): KategoriAnalizi[] {
  const analizler = kategoriAnaliziYap(veriler)
  return analizler.slice(0, limit)
}


