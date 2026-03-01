import { FinansalVeriler } from '@/types'
import { getStorageAdapter } from '@/lib/platform'

const STORAGE_KEY = 'finansal_veriler'
const ONBOARDING_KEY = 'onboarding_done'

export function isOnboardingDone(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function setOnboardingDone(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

export function loadData(): FinansalVeriler {
  const storage = getStorageAdapter()
  
  try {
    const stored = storage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        ...getDefaultData(),
        ...data,
        maas: data.maas || { tutar: 0, gun: 1 },
        ek_gelirler: data.ek_gelirler || [],
        son_maas_tarihi: data.son_maas_tarihi || null,
        odeme_gecmisi: data.odeme_gecmisi || [],
        hedefler: data.hedefler || [],
        kredi_kartlari: data.kredi_kartlari || [],
        harcamalar: data.harcamalar || [],
      }
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error)
  }

  return getDefaultData()
}

export function saveData(data: FinansalVeriler): void {
  const storage = getStorageAdapter()

  try {
    const json = JSON.stringify(data)
    storage.setItem(STORAGE_KEY, json)

    // Electron ortamında dosyaya da kaydet (reinstall'dan etkilenmez)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.saveData) {
      ;(window as any).electronAPI.saveData(json).catch((err: Error) => {
        console.error('Dosya kaydetme hatası:', err)
      })
    }
  } catch (error) {
    console.error('Veri kaydetme hatası:', error)
    throw error
  }
}

// Veri yedekleme/geri yükleme fonksiyonları
export function exportData(): string {
  const storage = getStorageAdapter()
  const data = storage.getItem(STORAGE_KEY)
  return data || JSON.stringify(getDefaultData())
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)
    const storage = getStorageAdapter()
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Veri içe aktarma hatası:', error)
    return false
  }
}

function getDefaultData(): FinansalVeriler {
  return {
    nakit_bakiye: 0,
    borclar: [],
    maas: { tutar: 0, gun: 1 },
    son_maas_tarihi: null,
    odeme_gecmisi: [],
    hedefler: [],
    harcamalar: [],
    kredi_kartlari: [],
    ek_gelirler: [],
  }
}

