/**
 * Shared Calculation Functions
 * Bu fonksiyonlar hem web hem mobil uygulamada kullanılabilir
 * Platform-specific bağımlılıkları içermez
 */

export interface KrediHesaplamaParams {
  tutar: number
  vade: number
  faiz_aylik: number
}

export interface KrediHesaplamaResult {
  aylik_taksit: number
  toplam_odeme: number
  toplam_faiz: number
}

/**
 * Kredi hesaplama fonksiyonu - Düzeltilmiş versiyon
 * Matematiksel hata düzeltildi: vade 0 kontrolü eklendi
 */
export function krediHesapla(params: KrediHesaplamaParams): KrediHesaplamaResult {
  const { tutar, vade, faiz_aylik } = params

  // Validasyon
  if (tutar <= 0 || vade <= 0) {
    return {
      aylik_taksit: 0,
      toplam_odeme: 0,
      toplam_faiz: 0,
    }
  }

  let aylik_taksit: number

  if (faiz_aylik === 0) {
    // Faizsiz kredi
    aylik_taksit = tutar / vade
  } else {
    // Faizli kredi - Annüite formülü
    const faiz = faiz_aylik / 100
    const payda = Math.pow(1 + faiz, vade) - 1
    
    // Payda 0 kontrolü (matematiksel hata önleme)
    if (payda === 0) {
      aylik_taksit = tutar / vade
    } else {
      aylik_taksit = (tutar * faiz * Math.pow(1 + faiz, vade)) / payda
    }
  }

  // Yuvarlama hatalarını önlemek için precision kontrolü
  aylik_taksit = Math.round(aylik_taksit * 100) / 100

  const toplam_odeme = Math.round(aylik_taksit * vade * 100) / 100
  const toplam_faiz = Math.round((toplam_odeme - tutar) * 100) / 100

  return {
    aylik_taksit,
    toplam_odeme,
    toplam_faiz: Math.max(0, toplam_faiz), // Negatif faiz olamaz
  }
}

/**
 * Yüzde hesaplama - Güvenli versiyon
 */
export function yuzdeHesapla(mevcut: number, toplam: number): number {
  if (toplam === 0) return 0
  return Math.round((mevcut / toplam) * 100 * 100) / 100
}

/**
 * Ortalama hesaplama - Güvenli versiyon
 */
export function ortalamaHesapla(degerler: number[]): number {
  if (degerler.length === 0) return 0
  const toplam = degerler.reduce((sum, val) => sum + val, 0)
  return Math.round((toplam / degerler.length) * 100) / 100
}

/**
 * Net değer hesaplama
 */
export function netDegerHesapla(
  nakit: number,
  borclar: number,
  krediKartiBorcu: number = 0
): number {
  return Math.round((nakit - borclar - krediKartiBorcu) * 100) / 100
}


