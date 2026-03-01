# Kurulum Rehberi

## Gereksinimler

1. **Node.js** (v18 veya üzeri) - [İndir](https://nodejs.org/)
2. **npm** (Node.js ile birlikte gelir)

## Kurulum Adımları

### 1. Node.js Kontrolü

Terminal/PowerShell'de şu komutu çalıştırın:

```bash
node --version
npm --version
```

Eğer versiyon görmüyorsanız, Node.js yüklü değildir. Yukarıdaki linkten indirip yükleyin.

### 2. Proje Klasörüne Gidin

```bash
cd "C:\Users\user\OneDrive\Desktop\Projem"
```

### 3. Bağımlılıkları Yükleyin

**Windows PowerShell'de:**
```powershell
npm install
```

**Eğer hata alırsanız, şunları deneyin:**

```powershell
# Cache temizle
npm cache clean --force

# Tekrar dene
npm install
```

**Alternatif olarak yarn kullanabilirsiniz:**
```powershell
npm install -g yarn
yarn install
```

### 4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Olası Sorunlar ve Çözümleri

### Sorun 1: "npm: command not found" veya "npm is not recognized"

**Çözüm:** Node.js düzgün yüklenmemiş. Node.js'i yeniden yükleyin ve bilgisayarı yeniden başlatın.

### Sorun 2: "EACCES" veya izin hatası

**Çözüm:** Yönetici olarak çalıştırın veya:
```bash
npm install --legacy-peer-deps
```

### Sorun 3: "ERR! network" hatası

**Çözüm:** İnternet bağlantınızı kontrol edin veya:
```bash
npm install --registry https://registry.npmjs.org/
```

### Sorun 4: Python/build tools hatası

**Çözüm:** Windows Build Tools yükleyin:
```bash
npm install --global windows-build-tools
```

Veya Visual Studio Build Tools'u yükleyin.

### Sorun 5: Node.js versiyonu eski

**Çözüm:** Node.js'i güncelleyin. v18 veya üzeri olmalı.

## Alternatif Kurulum Yöntemleri

### Yarn ile:

```bash
npm install -g yarn
yarn install
yarn dev
```

### pnpm ile:

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

## Hala Sorun mu Var?

1. `package-lock.json` dosyasını silin ve tekrar deneyin
2. `node_modules` klasörünü silin ve tekrar deneyin
3. Node.js'i kaldırıp yeniden yükleyin
4. Antivirus/firewall'u geçici olarak kapatın





