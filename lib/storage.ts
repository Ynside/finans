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
  // Electron: dosyadan ve localStorage'dan oku, hangisi daha doluysa onu kullan
  if (typeof window !== 'undefined' && (window as any).electronAPI?.loadData) {
    let fileData: FinansalVeriler | null = null
    let localData: FinansalVeriler | null = null

    try {
      const raw = (window as any).electronAPI.loadData()
      if (raw) {
        fileData = normalizeData(JSON.parse(raw))
      }
    } catch (error) {
      console.error('Electron dosya okuma hatası:', error)
    }

    // localStorage'dan migrasyon için kontrol et
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        localData = normalizeData(JSON.parse(stored))
      }
    } catch (error) {
      console.error('localStorage okuma hatası:', error)
    }

    // Hangisi daha fazla veri içeriyorsa onu kullan
    if (localData && (!fileData || dataWeight(localData) > dataWeight(fileData))) {
      // localStorage'daki veriyi dosyaya kaydet (tek seferlik migrasyon)
      const json = JSON.stringify(localData)
      ;(window as any).electronAPI.saveData(json).catch((err: Error) => {
        console.error('Migrasyon dosya kaydetme hatası:', err)
      })
      return localData
    }

    if (fileData) return fileData
  }

  // Web fallback: localStorage
  const storage = getStorageAdapter()
  try {
    const stored = storage.getItem(STORAGE_KEY)
    if (stored) {
      return normalizeData(JSON.parse(stored))
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

export function resetData(): void {
  const storage = getStorageAdapter()
  const defaultJson = JSON.stringify(getDefaultData())
  storage.setItem(STORAGE_KEY, defaultJson)

  if (typeof window !== 'undefined' && (window as any).electronAPI?.saveData) {
    ;(window as any).electronAPI.saveData(defaultJson).catch((err: Error) => {
      console.error('Sıfırlama dosya kaydetme hatası:', err)
    })
  }
}

// Veri yedekleme/geri yükleme fonksiyonları
export function exportData(): string {
  // Electron: dosyadan oku (localStorage yetersiz olabilir)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.loadData) {
    const raw = (window as any).electronAPI.loadData()
    if (raw) return raw
  }
  const storage = getStorageAdapter()
  return storage.getItem(STORAGE_KEY) || JSON.stringify(getDefaultData())
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)
    const json = JSON.stringify(data)
    const storage = getStorageAdapter()
    storage.setItem(STORAGE_KEY, json)
    // Electron: dosyaya da yaz
    if (typeof window !== 'undefined' && (window as any).electronAPI?.saveData) {
      ;(window as any).electronAPI.saveData(json).catch((err: Error) => {
        console.error('Import dosya kaydetme hatası:', err)
      })
    }
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
    sabit_giderler: [],
  }
}

function normalizeData(data: any): FinansalVeriler {
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
    sabit_giderler: data.sabit_giderler || [],
  }
}

function dataWeight(data: FinansalVeriler): number {
  return (
    (data.borclar?.length || 0) +
    (data.hedefler?.length || 0) +
    (data.harcamalar?.length || 0) +
    (data.kredi_kartlari?.length || 0) +
    (data.ek_gelirler?.length || 0) +
    (data.odeme_gecmisi?.length || 0) +
    (data.sabit_giderler?.length || 0) +
    (data.nakit_bakiye > 0 ? 1 : 0) +
    (data.maas?.tutar > 0 ? 1 : 0)
  )
}

