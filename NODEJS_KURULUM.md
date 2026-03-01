# Node.js Kurulum Rehberi

## ⚠️ ÖNEMLİ: Node.js Yüklü Değil!

Sisteminizde Node.js bulunamadı. npm install yapabilmek için önce Node.js yüklemeniz gerekiyor.

## Adım 1: Node.js İndirme

1. Tarayıcınızda şu adresi açın: **https://nodejs.org/**
2. **LTS (Long Term Support)** versiyonunu indirin (önerilen)
3. İndirilen `.msi` dosyasını çalıştırın

## Adım 2: Node.js Kurulumu

1. Kurulum sihirbazını açın
2. **"Next"** butonlarına tıklayarak ilerleyin
3. **"Add to PATH"** seçeneğinin işaretli olduğundan emin olun
4. Kurulumu tamamlayın

## Adım 3: Bilgisayarı Yeniden Başlatın

Kurulumdan sonra bilgisayarınızı yeniden başlatın (PATH değişikliklerinin etkili olması için).

## Adım 4: Kontrol Edin

Yeni bir PowerShell/Terminal penceresi açın ve şu komutları çalıştırın:

```powershell
node --version
npm --version
```

Her iki komut da bir versiyon numarası göstermelidir (örnek: v18.17.0, 9.6.7).

## Adım 5: Projeyi Kurun

Node.js kurulduktan sonra:

```powershell
cd "C:\Users\user\OneDrive\Desktop\Projem"
npm install
npm run dev
```

## Hızlı İndirme Linki

- **Windows 64-bit:** https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
- **Tüm versiyonlar:** https://nodejs.org/download/

## Alternatif: Chocolatey ile Kurulum

Eğer Chocolatey yüklüyse:

```powershell
choco install nodejs
```

## Sorun Giderme

### "node is not recognized" hatası devam ediyorsa:

1. Bilgisayarı yeniden başlatın
2. Yeni bir terminal penceresi açın
3. Node.js kurulumunu kontrol edin: `C:\Program Files\nodejs\` klasörü var mı?

### PATH'e manuel ekleme:

1. Windows arama çubuğuna "environment variables" yazın
2. "Edit the system environment variables" seçin
3. "Environment Variables" butonuna tıklayın
4. "Path" değişkenini seçin ve "Edit" yapın
5. `C:\Program Files\nodejs\` yolunu ekleyin





