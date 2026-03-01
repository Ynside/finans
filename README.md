# Finansal Takip Sistemi

Modern, responsive ve mobile-ready finansal takip ve borç yönetim uygulaması. Next.js 14, TypeScript ve Tailwind CSS ile geliştirilmiştir.

## ✨ Özellikler

- 💰 **Nakit Bakiye Yönetimi**: Nakit ekleme/çıkarma işlemleri
- 💳 **Borç Yönetimi**: Taksitli borç takibi ve ödeme yönetimi
- 📊 **Dashboard**: Finansal durum özeti ve bildirimler
- 📈 **12 Aylık Projeksiyon**: Gelecek aylar için finansal projeksiyon
- 💰 **Kredi Simülasyonu**: Kredi hesaplama ve projeksiyon önizleme
- ⚙️ **Maaş Yönetimi**: Otomatik maaş ekleme sistemi
- 📊 **Excel Export**: Verileri Excel formatında dışa aktarma
- 🔔 **Bildirimler**: Yaklaşan ödemeler ve uyarılar
- 📱 **Responsive Tasarım**: Mobil ve desktop uyumlu

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın

## 📦 Build

Production build için:

```bash
npm run build
npm start
```

## 🏗️ Proje Yapısı

```
├── app/                    # Next.js App Router sayfaları
│   ├── page.tsx           # Dashboard
│   ├── borclar/           # Borçlar sayfası
│   ├── projeksiyon/       # Projeksiyon sayfası
│   ├── kredi-simulasyon/  # Kredi simülasyonu
│   └── ayarlar/           # Ayarlar sayfası
├── components/             # React bileşenleri
│   ├── ui/                # UI bileşenleri (Button, Card, Modal, vb.)
│   └── modals/            # Modal bileşenleri
├── lib/                   # Utility fonksiyonları
│   ├── finansal.ts        # Finansal hesaplamalar
│   ├── storage.ts          # LocalStorage yönetimi
│   ├── utils.ts            # Yardımcı fonksiyonlar
│   └── excel.ts            # Excel export
└── types/                 # TypeScript tip tanımları
```

## 💾 Veri Saklama

Uygulama verileri tarayıcının LocalStorage'ında saklanır. Tüm veriler cihazınızda kalır, sunucuya gönderilmez.

## 📱 Mobile Dönüşüm

Bu proje React Native'e kolayca dönüştürülebilir:

1. **Shared Logic**: `lib/` klasöründeki tüm fonksiyonlar aynen kullanılabilir
2. **Components**: UI bileşenleri React Native bileşenleriyle değiştirilebilir
3. **Storage**: LocalStorage yerine AsyncStorage kullanılabilir
4. **Navigation**: Next.js routing yerine React Navigation kullanılabilir

## 🎨 Teknolojiler

- **Next.js 14**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Styling
- **date-fns**: Tarih işlemleri
- **xlsx**: Excel export
- **lucide-react**: İkonlar

## 📝 Lisans

Bu proje özel kullanım içindir.

## 🔄 Versiyon

v1.0.0 - Modern Web Uygulaması





