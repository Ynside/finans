import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPara(tutar: number, paraBirimi: 'USD' | 'TRY' | 'USDT' = 'TRY'): string {
  const currencyMap = {
    USD: 'USD',
    TRY: 'TRY',
    USDT: 'USDT',
  }

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyMap[paraBirimi],
    minimumFractionDigits: paraBirimi === 'USD' || paraBirimi === 'USDT' ? 2 : 0,
    maximumFractionDigits: paraBirimi === 'USD' || paraBirimi === 'USDT' ? 2 : 0,
  }).format(tutar)
}

export function parseTutar(tutarStr: string): number {
  if (!tutarStr || tutarStr.trim() === '') return 0
  
  // Türk formatı: 1.234,56 veya 1234,56 veya 1234.56
  // Virgül varsa ondalık ayırıcı olarak kullan
  // Nokta varsa binlik ayırıcı veya ondalık ayırıcı olabilir
  
  let cleaned = tutarStr.trim()
  
  // Virgül varsa, ondalık ayırıcı olarak kabul et
  if (cleaned.includes(',')) {
    // Binlik ayırıcı olarak nokta varsa kaldır
    cleaned = cleaned.replace(/\./g, '')
    // Virgülü noktaya çevir
    cleaned = cleaned.replace(',', '.')
  } else if (cleaned.includes('.')) {
    // Sadece nokta varsa, son noktadan sonra 2 veya daha az rakam varsa ondalık ayırıcı
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length <= 2) {
      // Ondalık ayırıcı olarak kabul et
      cleaned = cleaned
    } else {
      // Binlik ayırıcı olarak kabul et, kaldır
      cleaned = cleaned.replace(/\./g, '')
    }
  }
  
  const result = parseFloat(cleaned)
  return isNaN(result) ? 0 : result
}
