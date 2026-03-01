/**
 * Platform Abstraction Layer
 * Bu dosya mobil uygulamaya geçiş için platform-specific kodları soyutlar
 */

// Platform tespiti
export const PLATFORM = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
} as const

export type Platform = typeof PLATFORM[keyof typeof PLATFORM]

// Platform tespit fonksiyonu (şimdilik sadece web)
export function getPlatform(): Platform {
  if (typeof window === 'undefined') return PLATFORM.WEB
  
  // React Native için gelecekte burada kontrol yapılacak
  // const { Platform } = require('react-native')
  // return Platform.OS === 'ios' ? PLATFORM.IOS : PLATFORM.ANDROID
  
  return PLATFORM.WEB
}

// Storage abstraction
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

class WebStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }
}

// React Native için AsyncStorage adapter (gelecekte)
// class ReactNativeStorageAdapter implements StorageAdapter {
//   async getItem(key: string): Promise<string | null> {
//     const AsyncStorage = require('@react-native-async-storage/async-storage').default
//     return await AsyncStorage.getItem(key)
//   }
//   async setItem(key: string, value: string): Promise<void> {
//     const AsyncStorage = require('@react-native-async-storage/async-storage').default
//     await AsyncStorage.setItem(key, value)
//   }
//   async removeItem(key: string): Promise<void> {
//     const AsyncStorage = require('@react-native-async-storage/async-storage').default
//     await AsyncStorage.removeItem(key)
//   }
// }

export function getStorageAdapter(): StorageAdapter {
  const platform = getPlatform()
  
  switch (platform) {
    case PLATFORM.WEB:
      return new WebStorageAdapter()
    // case PLATFORM.IOS:
    // case PLATFORM.ANDROID:
    //   return new ReactNativeStorageAdapter()
    default:
      return new WebStorageAdapter()
  }
}

// Navigation abstraction (gelecekte React Navigation için)
export interface NavigationAdapter {
  navigate(route: string, params?: any): void
  goBack(): void
}

// File system abstraction (gelecekte)
export interface FileSystemAdapter {
  saveFile(data: string, filename: string): Promise<void>
  readFile(filename: string): Promise<string>
}


