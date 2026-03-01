# Mobil Uygulamaya Geçiş Rehberi

Bu proje mobil uygulamaya (iOS/Android) geçiş için hazırlanmıştır. Platform abstraction layer ve shared logic yapısı sayesinde kolayca React Native'e dönüştürülebilir.

## Yapılan Değişiklikler

### 1. Platform Abstraction Layer (`lib/platform/`)

Platform-specific kodlar soyutlandı:

- **Storage Adapter**: `localStorage` yerine platform-agnostic storage interface
- **Platform Detection**: Web/iOS/Android tespiti
- **Navigation Adapter**: Gelecekte React Navigation için hazır

### 2. Shared Logic (`lib/shared/`)

Platform bağımsız hesaplama fonksiyonları:

- **calculations.ts**: Kredi hesaplama, yüzde hesaplama, ortalama hesaplama
- **analytics.ts**: Kategori analizi, aylık özet hesaplama

### 3. Matematiksel Hata Düzeltmeleri

- **krediHesapla**: 
  - Vade 0 kontrolü eklendi
  - Payda 0 kontrolü eklendi
  - Yuvarlama hataları düzeltildi
  - Negatif faiz kontrolü eklendi

### 4. Yeni Özellikler

- **Veri Yedekleme/Geri Yükleme**: JSON formatında veri export/import
- **Kategori Bazlı Analiz**: Harcama kategorilerine göre detaylı analiz
- **Aylık Özet**: Son 6 ayın gelir-gider özeti
- **Responsive Design**: Mobil cihazlar için optimize edilmiş UI

## React Native'e Geçiş Adımları

### 1. Dependencies

```bash
npm install @react-native-async-storage/async-storage
npm install react-navigation
npm install date-fns  # Zaten var
```

### 2. Storage Adapter Güncelleme

`lib/platform/index.ts` dosyasında `ReactNativeStorageAdapter` sınıfını aktif edin:

```typescript
class ReactNativeStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default
    return await AsyncStorage.getItem(key)
  }
  // ... diğer metodlar
}
```

### 3. Navigation Güncelleme

React Navigation kullanarak navigation adapter'ı implement edin.

### 4. UI Component'leri

- Web: Tailwind CSS + Next.js
- Mobile: React Native StyleSheet veya NativeWind (Tailwind for RN)

### 5. Platform Detection

`getPlatform()` fonksiyonu React Native'de otomatik olarak iOS/Android döndürecek.

## Dosya Yapısı

```
lib/
├── platform/          # Platform abstraction
│   └── index.ts
├── shared/            # Shared logic (platform-agnostic)
│   ├── calculations.ts
│   └── analytics.ts
├── finansal.ts        # Business logic
└── storage.ts         # Storage (uses platform adapter)
```

## Test Edilmesi Gerekenler

- [ ] Storage adapter'ın tüm platformlarda çalışması
- [ ] Matematiksel hesaplamaların doğruluğu
- [ ] Veri yedekleme/geri yükleme
- [ ] Responsive design (mobil cihazlarda)
- [ ] Kategori analizi hesaplamaları

## Notlar

- Tüm business logic platform-agnostic olmalı
- UI component'leri platform-specific olabilir
- Storage ve navigation her zaman adapter üzerinden kullanılmalı


