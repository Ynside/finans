import { addMonths, parse, format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns'
import { hesaplaBakiye as hesaplaBakiyeLocal } from '@/lib/kredi-utils'
import type { EkGelir } from '@/types'
import type {
  FinansalVeriler,
  FinansalDurum,
  Bildirim,
  ProjeksiyonAyi,
  KrediHesaplama,
  YaklasanOdeme,
} from '@/types'

export function hesaplaFinansalDurum(veriler: FinansalVeriler): FinansalDurum {
  const nakit = veriler.nakit_bakiye

  const toplam_borc = veriler.borclar.reduce((toplam, borc) => {
    return (
      toplam +
      borc.taksitler
        .filter((t) => !t.odendi)
        .reduce((sum, t) => sum + t.tutar, 0)
    )
  }, 0)

  const bugun = new Date()
  const bugunGun = bugun.getDate()
  const ay_basi = startOfMonth(bugun)
  const ay_sonu = endOfMonth(bugun)

  const borc_bu_ay = veriler.borclar.reduce((toplam, borc) => {
    return (
      toplam +
      borc.taksitler
        .filter((t) => !t.odendi)
        .filter((t) => {
          try {
            const vade = parse(t.vade_tarihi, 'dd.MM.yyyy', new Date())
            return isWithinInterval(vade, { start: ay_basi, end: ay_sonu })
          } catch {
            return false
          }
        })
        .reduce((sum, t) => sum + t.tutar, 0)
    )
  }, 0)

  // Kredi kartı bu ay ödemeleri
  const kredi_bu_ay = (veriler.kredi_kartlari || []).reduce((toplam, kk) => {
    let kartOdeme = 0
    const hedefStart = bugun.getFullYear() * 12 + bugun.getMonth()

    // Ekstre borcu
    if (kk.donem_borcu && kk.donem_borcu > 0) {
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun < kk.ekstre_kesim_gunu) {
        ekstreAy -= 1
        if (ekstreAy < 0) { ekstreAy = 11; ekstreYil -= 1 }
      }
      let sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      if (sonOdeme < bugun) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
        sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      }
      if (isWithinInterval(sonOdeme, { start: ay_basi, end: ay_sonu })) {
        kartOdeme += kk.donem_borcu
      }
    }

    // Dönem içi harcama
    if (kk.donem_ici_harcama && kk.donem_ici_harcama > 0) {
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun >= kk.ekstre_kesim_gunu) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
      }
      const sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      if (isWithinInterval(sonOdeme, { start: ay_basi, end: ay_sonu })) {
        kartOdeme += kk.donem_ici_harcama
      }
    }

    // Taksit planları — yeni format
    for (const tp of (kk.taksit_planlari || [])) {
      try {
        const [planYil, planAy] = tp.baslangic.split('-').map(Number)
        const planStart = planYil * 12 + planAy - 1
        const idx = hedefStart - planStart
        if (idx >= 0 && idx < tp.kalan_taksit) {
          kartOdeme += tp.aylik_odemeler?.[idx] ?? tp.aylik_tutar
        }
      } catch { /* ignore */ }
    }

    // Taksitler — eski format (KrediKartiTaksit[])
    for (const t of (kk.taksitler || [])) {
      try {
        const [gun, ayNo, yil] = t.sonraki_taksit_tarihi.split('.').map(Number)
        const ilkOdeme = new Date(yil, ayNo - 1, gun)
        for (let i = 0; i < t.kalan_taksit; i++) {
          const odemeTarihi = addMonths(ilkOdeme, i)
          if (isWithinInterval(odemeTarihi, { start: ay_basi, end: ay_sonu })) {
            kartOdeme += t.aylik_odemeler?.[i] ?? t.aylik_tutar
          }
        }
      } catch { /* ignore */ }
    }

    return toplam + kartOdeme
  }, 0)

  const bu_ay_odeme = borc_bu_ay + kredi_bu_ay

  // Kredi kartı toplam borcu
  const kredi_karti_borcu = (veriler.kredi_kartlari || []).reduce(
    (toplam, kk) => toplam + (kk.bakiye || 0),
    0
  )

  return {
    nakit,
    toplam_borc,
    net: nakit - toplam_borc - kredi_karti_borcu,
    bu_ay_odeme,
    kalan: nakit - bu_ay_odeme,
    kredi_karti_borcu,
  }
}

export function bildirimleriOlustur(veriler: FinansalVeriler): Bildirim[] {
  const bildirimler: Bildirim[] = []
  const durum = hesaplaFinansalDurum(veriler)
  const bugun = new Date()

  // Bu ay ödeme yetersizliği
  if (durum.bu_ay_odeme > durum.nakit) {
    const eksik = durum.bu_ay_odeme - durum.nakit
    bildirimler.push({
      tip: 'danger',
      mesaj: `⚠️ DİKKAT: Bu ay ${formatPara(eksik)} eksik! Ödeme yapmak için nakit yetersiz.`,
    })
  }

  // 7 gün içinde yaklaşan ödemeler
  const limit = new Date(bugun.getTime() + 7 * 24 * 60 * 60 * 1000)
  let yaklasan = 0

  for (const borc of veriler.borclar) {
    for (const taksit of borc.taksitler) {
      if (!taksit.odendi) {
        try {
          const vade = parse(taksit.vade_tarihi, 'dd.MM.yyyy', new Date())
          if (vade >= bugun && vade <= limit) {
            yaklasan += taksit.tutar
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (yaklasan > 0) {
    bildirimler.push({
      tip: 'warning',
      mesaj: `📌 7 gün içinde ${formatPara(yaklasan)} borç ödemesi var.`,
    })
  }

  // 7 gün içinde kredi kartı ödemeleri
  const bugunGun = bugun.getDate()
  let krediYaklasan = 0
  for (const kk of (veriler.kredi_kartlari || [])) {
    if (kk.donem_borcu && kk.donem_borcu > 0) {
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun < kk.ekstre_kesim_gunu) {
        ekstreAy -= 1
        if (ekstreAy < 0) { ekstreAy = 11; ekstreYil -= 1 }
      }
      let sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      if (sonOdeme < bugun) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
        sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      }
      if (sonOdeme >= bugun && sonOdeme <= limit) {
        krediYaklasan += kk.donem_borcu
      }
    }
  }
  if (krediYaklasan > 0) {
    bildirimler.push({
      tip: 'warning',
      mesaj: `💳 7 gün içinde ${formatPara(krediYaklasan)} kredi kartı ekstre ödemesi var.`,
    })
  }

  // Geciken ödemeler
  let geciken = 0
  for (const borc of veriler.borclar) {
    for (const taksit of borc.taksitler) {
      if (!taksit.odendi) {
        try {
          const vade = parse(taksit.vade_tarihi, 'dd.MM.yyyy', new Date())
          if (vade < bugun) {
            geciken += taksit.tutar
          }
        } catch {
          // ignore
        }
      }
    }
  }

  if (geciken > 0) {
    bildirimler.push({
      tip: 'danger',
      mesaj: `🚨 VADESİ GEÇMİŞ: ${formatPara(geciken)} ödeme yapılmadı!`,
    })
  }

  // Pozitif bildirim
  if (durum.net > 100000) {
    bildirimler.push({
      tip: 'success',
      mesaj: `🎉 Harika! Net varlığınız ${formatPara(durum.net)} seviyesinde.`,
    })
  }

  return bildirimler
}

export function projeksiyonHesapla(
  veriler: FinansalVeriler,
  ekKredi?: { vade: number; aylik_taksit: number; ilk_taksit_tarihi: string }
): ProjeksiyonAyi[] {
  const bugun = new Date()
  const projeksiyon: ProjeksiyonAyi[] = []

  const maas_tutar = veriler.maas.tutar
  let baslangic_bakiye = veriler.nakit_bakiye

  const son_maas = veriler.son_maas_tarihi
  const bugun_ay = format(bugun, 'yyyy-MM')

  if (son_maas === bugun_ay) {
    baslangic_bakiye -= maas_tutar
  }

  for (let ay_offset = 0; ay_offset < 12; ay_offset++) {
    const hedef_tarih = addMonths(bugun, ay_offset)
    const ay_basi = startOfMonth(hedef_tarih)
    const ay_sonu = endOfMonth(hedef_tarih)

    // Maaş + Ek gelirler
    const ekGelirToplam = (veriler.ek_gelirler || []).reduce((toplam, eg) => {
      // Bu ay ek gelir eklenmiş mi kontrol et
      try {
        const [yil, ay] = (eg.son_ekleme_tarihi || '').split('-').map(Number)
        const hedefAy = hedef_tarih.getMonth() + 1
        const hedefYil = hedef_tarih.getFullYear()
        
        // Eğer bu ay eklenmemişse veya farklı bir ay ise ekle
        if (!eg.son_ekleme_tarihi || 
            (hedefYil > yil || (hedefYil === yil && hedefAy > ay)) ||
            (hedefYil === yil && hedefAy === ay && hedef_tarih.getDate() >= eg.gun)) {
          return toplam + eg.tutar
        }
      } catch {
        // İlk kez ekleniyorsa
        if (hedef_tarih.getDate() >= eg.gun) {
          return toplam + eg.tutar
        }
      }
      return toplam
    }, 0)
    
    const gelir = maas_tutar + ekGelirToplam

    // Borç taksitleri
    const borcGider = veriler.borclar.reduce((toplam, borc) => {
      return (
        toplam +
        borc.taksitler
          .filter((t) => !t.odendi)
          .filter((t) => {
            try {
              const vade = parse(t.vade_tarihi, 'dd.MM.yyyy', new Date())
              return isWithinInterval(vade, { start: ay_basi, end: ay_sonu })
            } catch {
              return false
            }
          })
          .reduce((sum, t) => sum + t.tutar, 0)
      )
    }, 0)

    // Bu ayki harcamalar (sadece nakit)
    const buAyHarcamalar = veriler.harcamalar?.filter((h) => {
      try {
        const [gun, ay, yil] = h.tarih.split('.')
        const harcamaTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
        return (
          isWithinInterval(harcamaTarihi, { start: ay_basi, end: ay_sonu }) &&
          h.tip === 'nakit'
        )
      } catch {
        return false
      }
    }) || []

    const buAyHarcamaToplam = buAyHarcamalar.reduce((sum, h) => sum + h.tutar, 0)

    // Geçmiş aylardan ortalama hesapla (projeksiyon için)
    const gecmisHarcamalar = veriler.harcamalar?.filter((h) => {
      try {
        const [gun, ay, yil] = h.tarih.split('.')
        const harcamaTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
        return harcamaTarihi < ay_basi && h.tip === 'nakit'
      } catch {
        return false
      }
    }) || []

    // Ortalama aylık harcama hesapla - daha doğru hesaplama
    let ortalamaAylikHarcama = 0
    if (gecmisHarcamalar.length > 0) {
      // Geçmiş harcamaları aylara göre grupla
      const aylikHarcamalar: Record<string, number> = {}
      gecmisHarcamalar.forEach((h) => {
        try {
          const [gun, ay, yil] = h.tarih.split('.')
          const ayKey = `${yil}-${ay.padStart(2, '0')}`
          aylikHarcamalar[ayKey] = (aylikHarcamalar[ayKey] || 0) + h.tutar
        } catch {
          // ignore
        }
      })
      
      const aySayisi = Object.keys(aylikHarcamalar).length
      if (aySayisi > 0) {
        const toplamHarcama = Object.values(aylikHarcamalar).reduce((sum, tutar) => sum + tutar, 0)
        ortalamaAylikHarcama = toplamHarcama / aySayisi
      }
    }

    // Kredi kartı dönem borcu - bir sonraki son ödeme tarihinde tek seferlik ödenir
    const donemBorcuOdeme = (veriler.kredi_kartlari || []).reduce((toplam, kk) => {
      if (!kk.donem_borcu || kk.donem_borcu <= 0) return toplam
      try {
        const bugunGun = bugun.getDate()
        let ekstreAy = bugun.getMonth()
        let ekstreYil = bugun.getFullYear()
        if (bugunGun < kk.ekstre_kesim_gunu) {
          ekstreAy -= 1
          if (ekstreAy < 0) { ekstreAy = 11; ekstreYil -= 1 }
        }
        let odemeTarihi = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
        if (odemeTarihi < bugun) {
          ekstreAy += 1
          if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
          odemeTarihi = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
        }
        if (isWithinInterval(odemeTarihi, { start: ay_basi, end: ay_sonu })) {
          return toplam + kk.donem_borcu
        }
      } catch { /* ignore */ }
      return toplam
    }, 0)

    // Kredi kartı dönem içi harcama ödemeleri - mevcut dönem ekstresinde ödenir
    const donemIciOdeme = (veriler.kredi_kartlari || []).reduce((toplam, kk) => {
      if (!kk.donem_ici_harcama || kk.donem_ici_harcama <= 0) return toplam
      try {
        const bugunGun = bugun.getDate()
        let ekstreAy = bugun.getMonth()
        let ekstreYil = bugun.getFullYear()
        if (bugunGun >= kk.ekstre_kesim_gunu) {
          // Ekstre bu ay kesildi, dönem içi sonraki ay ödenecek
          ekstreAy += 1
          if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
        }
        const ekstreTarihi = new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu)
        const odemeTarihi = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 24 * 60 * 60 * 1000)
        if (isWithinInterval(odemeTarihi, { start: ay_basi, end: ay_sonu })) {
          return toplam + kk.donem_ici_harcama
        }
      } catch { /* ignore */ }
      return toplam
    }, 0)

    // Kredi kartı taksit ödemeleri
    const krediKartiTaksitOdeme = (veriler.kredi_kartlari || []).reduce((toplam, kk) => {
      const hedefStart = hedef_tarih.getFullYear() * 12 + hedef_tarih.getMonth()

      // YENİ FORMAT: taksit_planlari varsa (boş array dahil) kullan
      if (kk.taksit_planlari !== undefined) {
        for (const tp of kk.taksit_planlari) {
          try {
            const [planYil, planAy] = tp.baslangic.split('-').map(Number)
            const planStart = planYil * 12 + planAy - 1
            const idx = hedefStart - planStart
            if (idx >= 0 && idx < tp.kalan_taksit) {
              toplam += tp.aylik_odemeler?.[idx] ?? tp.aylik_tutar
            }
          } catch { /* ignore */ }
        }
        return toplam
      }

      // ESKİ FORMAT: odeme_plani (backward compat)
      if (kk.odeme_plani) {
        try {
          const [planYil, planAy] = kk.odeme_plani.baslangic.split('-').map(Number)
          const planStart = planYil * 12 + planAy - 1
          const idx = hedefStart - planStart
          if (idx >= 0 && idx < kk.odeme_plani.aylar.length) {
            return toplam + kk.odeme_plani.aylar[idx]
          }
        } catch { /* ignore */ }
        return toplam
      }

      // Çok eski format: KrediKartiTaksit[]
      return toplam + (kk.taksitler || []).reduce((sum, taksit) => {
        try {
          const [gun, ay, yil] = taksit.sonraki_taksit_tarihi.split('.')
          const ilkOdeme = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
          for (let i = 0; i < taksit.kalan_taksit; i++) {
            const odemeTarihi = addMonths(ilkOdeme, i)
            if (isWithinInterval(odemeTarihi, { start: ay_basi, end: ay_sonu })) {
              return sum + (taksit.aylik_odemeler?.[i] ?? taksit.aylik_tutar)
            }
          }
        } catch { /* ignore */ }
        return sum
      }, 0)
    }, 0)

    // Bu ay için: gerçek harcamalar, gelecek aylar için: ortalama
    const harcamaTutari =
      ay_offset === 0 ? buAyHarcamaToplam : ortalamaAylikHarcama

    // Sabit giderler — sadece nakit tipi (kredi kartı tipler donem_ici_harcama'ya eklenir, orada zaten sayılır)
    const sabitGiderToplam = (veriler.sabit_giderler || [])
      .filter((sg) => sg.tip === 'nakit')
      .reduce((sum, sg) => sum + sg.tutar, 0)

    const gider = borcGider + harcamaTutari + krediKartiTaksitOdeme + donemBorcuOdeme + donemIciOdeme + sabitGiderToplam

    let kredi_taksit = 0
    if (ekKredi) {
      try {
        const ilk_tarih = parse(ekKredi.ilk_taksit_tarihi, 'dd.MM.yyyy', new Date())
        const son_tarih = addMonths(ilk_tarih, ekKredi.vade - 1)
        const ilk_ay_basi = startOfMonth(ilk_tarih)
        const son_ay_basi = startOfMonth(son_tarih)

        if (ay_basi >= ilk_ay_basi && ay_basi <= son_ay_basi) {
          kredi_taksit = ekKredi.aylik_taksit
        }
      } catch {
        // ignore
      }
    }

    const net_fark = gelir - gider - kredi_taksit
    const bitis_bakiye = baslangic_bakiye + net_fark

    projeksiyon.push({
      ay: format(hedef_tarih, 'MMMM yyyy'),
      baslangic: baslangic_bakiye,
      gelir,
      gider,
      kredi_taksit,
      net_fark,
      bitis: bitis_bakiye,
    })

    baslangic_bakiye = bitis_bakiye
  }

  return projeksiyon
}

export function krediHesapla(tutar: number, vade: number, faiz_aylik: number): KrediHesaplama {
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
    if (payda === 0 || !isFinite(payda)) {
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

export function yaklasanOdemeleriGetir(veriler: FinansalVeriler, gunSayisi: number = 30): YaklasanOdeme[] {
  const bugun = new Date()
  const limit = new Date(bugun.getTime() + gunSayisi * 24 * 60 * 60 * 1000)

  const odemeler: YaklasanOdeme[] = []

  for (const borc of veriler.borclar) {
    for (let idx = 0; idx < borc.taksitler.length; idx++) {
      const taksit = borc.taksitler[idx]
      if (!taksit.odendi) {
        try {
          const vade = parse(taksit.vade_tarihi, 'dd.MM.yyyy', new Date())
          if (vade <= limit) {
            const fark = differenceInDays(vade, bugun)
            odemeler.push({
              aciklama: borc.aciklama,
              tutar: taksit.tutar,
              vade,
              vade_str: taksit.vade_tarihi,
              fark,
              borc,
              taksit,
              taksit_index: idx,
            })
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Kredi kartı ödemeleri
  for (const kk of (veriler.kredi_kartlari || [])) {
    const bugunGun = bugun.getDate()

    // 1. Ekstre borcu — son ödeme tarihi
    if (kk.donem_borcu && kk.donem_borcu > 0) {
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun < kk.ekstre_kesim_gunu) {
        ekstreAy -= 1
        if (ekstreAy < 0) { ekstreAy = 11; ekstreYil -= 1 }
      }
      let sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      // Son ödeme geçtiyse bir dönem ileri al (roll over)
      if (sonOdeme < bugun) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
        sonOdeme = new Date(new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu).getTime() + kk.son_odeme_gunu * 86400000)
      }
      if (sonOdeme >= bugun && sonOdeme <= limit) {
        odemeler.push({
          odeme_tipi: 'kredi_karti',
          aciklama: `${kk.ad} — Ekstre Borcu`,
          kredi_karti_detay: 'Kilitli ekstre borcu',
          tutar: kk.donem_borcu,
          vade: sonOdeme,
          vade_str: format(sonOdeme, 'dd.MM.yyyy'),
          fark: differenceInDays(sonOdeme, bugun),
          kredi_karti: kk,
        })
      }
    }

    // 2. Dönem içi harcama
    if (kk.donem_ici_harcama && kk.donem_ici_harcama > 0) {
      let ekstreAy = bugun.getMonth()
      let ekstreYil = bugun.getFullYear()
      if (bugunGun >= kk.ekstre_kesim_gunu) {
        ekstreAy += 1
        if (ekstreAy > 11) { ekstreAy = 0; ekstreYil += 1 }
      }
      const ekstreTarihi = new Date(ekstreYil, ekstreAy, kk.ekstre_kesim_gunu)
      const sonOdeme = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 86400000)
      if (sonOdeme >= bugun && sonOdeme <= limit) {
        odemeler.push({
          odeme_tipi: 'kredi_karti',
          aciklama: `${kk.ad} — Dönem İçi Harcama`,
          kredi_karti_detay: 'Bu dönem yapılan harcamalar',
          tutar: kk.donem_ici_harcama,
          vade: sonOdeme,
          vade_str: format(sonOdeme, 'dd.MM.yyyy'),
          fark: differenceInDays(sonOdeme, bugun),
          kredi_karti: kk,
        })
      }
    }

    // 3. Taksit planları — önümüzdeki 3 ay (tüm formatlar)
    const hasTaksitler = (kk.taksit_planlari?.length ?? 0) > 0 || (kk.taksitler?.length ?? 0) > 0 || !!kk.odeme_plani
    if (hasTaksitler) {
      for (let offset = 0; offset <= 3; offset++) {
        const checkDate = addMonths(startOfMonth(bugun), offset)
        const checkAy_basi = startOfMonth(checkDate)
        const checkAy_sonu = endOfMonth(checkDate)
        const hedefStart = checkDate.getFullYear() * 12 + checkDate.getMonth()

        let monthTotal = 0
        const monthDetails: string[] = []

        // Yeni format
        for (const tp of (kk.taksit_planlari || [])) {
          try {
            const [planYil, planAy] = tp.baslangic.split('-').map(Number)
            const planStart = planYil * 12 + planAy - 1
            const idx = hedefStart - planStart
            if (idx >= 0 && idx < tp.kalan_taksit) {
              monthTotal += tp.aylik_odemeler?.[idx] ?? tp.aylik_tutar
              monthDetails.push(tp.aciklama)
            }
          } catch { /* ignore */ }
        }

        // Eski format (KrediKartiTaksit[])
        for (const t of (kk.taksitler || [])) {
          try {
            const [gun, ayNo, yil] = t.sonraki_taksit_tarihi.split('.').map(Number)
            const ilkOdeme = new Date(yil, ayNo - 1, gun)
            for (let i = 0; i < t.kalan_taksit; i++) {
              const odemeTarihi = addMonths(ilkOdeme, i)
              if (isWithinInterval(odemeTarihi, { start: checkAy_basi, end: checkAy_sonu })) {
                monthTotal += t.aylik_odemeler?.[i] ?? t.aylik_tutar
                monthDetails.push(t.aciklama)
              }
            }
          } catch { /* ignore */ }
        }

        if (monthTotal > 0) {
          const ekstreTarihi = new Date(checkDate.getFullYear(), checkDate.getMonth(), kk.ekstre_kesim_gunu)
          const sonOdeme = new Date(ekstreTarihi.getTime() + kk.son_odeme_gunu * 86400000)
          if (sonOdeme >= bugun && sonOdeme <= limit) {
            odemeler.push({
              odeme_tipi: 'kredi_karti',
              aciklama: `${kk.ad} — Taksit Ödemeleri`,
              kredi_karti_detay: monthDetails.join(', '),
              tutar: monthTotal,
              vade: sonOdeme,
              vade_str: format(sonOdeme, 'dd.MM.yyyy'),
              fark: differenceInDays(sonOdeme, bugun),
              kredi_karti: kk,
            })
          }
        }
      }
    }
  }

  return odemeler.sort((a, b) => a.vade.getTime() - b.vade.getTime())
}

export function maasKontrolEt(veriler: FinansalVeriler): { veriler: FinansalVeriler; maasEklendi: boolean } {
  const maas_tutar = veriler.maas.tutar
  const maas_gun = veriler.maas.gun

  if (maas_tutar <= 0) {
    return { veriler, maasEklendi: false }
  }

  const bugun = new Date()
  const son_maas = veriler.son_maas_tarihi

  if (son_maas === null) {
    if (bugun.getDate() >= maas_gun) {
      const yeniVeriler = {
        ...veriler,
        nakit_bakiye: veriler.nakit_bakiye + maas_tutar,
        son_maas_tarihi: format(bugun, 'yyyy-MM'),
      }
      return { veriler: yeniVeriler, maasEklendi: true }
    }
    return { veriler, maasEklendi: false }
  }

  try {
    const [son_yil, son_ay] = son_maas.split('-').map(Number)
    const bugun_ay = bugun.getMonth() + 1
    const bugun_yil = bugun.getFullYear()

    if (
      (bugun_yil > son_yil || (bugun_yil === son_yil && bugun_ay > son_ay)) &&
      bugun.getDate() >= maas_gun
    ) {
      const yeniVeriler = {
        ...veriler,
        nakit_bakiye: veriler.nakit_bakiye + maas_tutar,
        son_maas_tarihi: format(bugun, 'yyyy-MM'),
      }
      return { veriler: yeniVeriler, maasEklendi: true }
    }
  } catch {
    // ignore
  }

  return { veriler, maasEklendi: false }
}

export function ekGelirKontrolEt(veriler: FinansalVeriler): { veriler: FinansalVeriler; ekGelirEklendi: boolean } {
  const bugun = new Date()
  let ekGelirEklendi = false
  let yeniVeriler = { ...veriler }

  for (const ekGelir of veriler.ek_gelirler || []) {
    if (ekGelir.tutar <= 0) continue

    const sonEkleme = ekGelir.son_ekleme_tarihi

    if (sonEkleme === null) {
      if (bugun.getDate() >= ekGelir.gun) {
        yeniVeriler.nakit_bakiye += ekGelir.tutar
        yeniVeriler.ek_gelirler = yeniVeriler.ek_gelirler?.map((eg) =>
          eg.id === ekGelir.id
            ? { ...eg, son_ekleme_tarihi: format(bugun, 'yyyy-MM') }
            : eg
        )
        ekGelirEklendi = true
      }
    } else {
      try {
        const [son_yil, son_ay] = sonEkleme.split('-').map(Number)
        const bugun_ay = bugun.getMonth() + 1
        const bugun_yil = bugun.getFullYear()

        if (
          (bugun_yil > son_yil || (bugun_yil === son_yil && bugun_ay > son_ay)) &&
          bugun.getDate() >= ekGelir.gun
        ) {
          yeniVeriler.nakit_bakiye += ekGelir.tutar
          yeniVeriler.ek_gelirler = yeniVeriler.ek_gelirler?.map((eg) =>
            eg.id === ekGelir.id
              ? { ...eg, son_ekleme_tarihi: format(bugun, 'yyyy-MM') }
              : eg
          )
          ekGelirEklendi = true
        }
      } catch {
        // ignore
      }
    }
  }

  return { veriler: yeniVeriler, ekGelirEklendi }
}

export function sabitGiderKontrolEt(veriler: FinansalVeriler): { veriler: FinansalVeriler; islemYapildi: boolean } {
  const bugun = new Date()
  let islemYapildi = false
  let yeniVeriler = { ...veriler, kredi_kartlari: veriler.kredi_kartlari ? [...veriler.kredi_kartlari] : [] }

  for (const gider of veriler.sabit_giderler || []) {
    if (gider.tutar <= 0) continue

    const sonIslem = gider.son_islem_tarihi
    const bugun_ay = bugun.getMonth() + 1
    const bugun_yil = bugun.getFullYear()

    let islemeGerek = false

    if (sonIslem === null) {
      if (bugun.getDate() >= gider.gun) islemeGerek = true
    } else {
      try {
        const [son_yil, son_ay] = sonIslem.split('-').map(Number)
        if (
          (bugun_yil > son_yil || (bugun_yil === son_yil && bugun_ay > son_ay)) &&
          bugun.getDate() >= gider.gun
        ) {
          islemeGerek = true
        }
      } catch { /* ignore */ }
    }

    if (!islemeGerek) continue

    if (gider.tip === 'nakit') {
      yeniVeriler.nakit_bakiye -= gider.tutar
    } else if (gider.tip === 'kredi_karti' && gider.kredi_karti_id) {
      yeniVeriler.kredi_kartlari = yeniVeriler.kredi_kartlari?.map((kk) => {
        if (kk.id !== gider.kredi_karti_id) return kk
        const guncellenmis = { ...kk, donem_ici_harcama: (kk.donem_ici_harcama || 0) + gider.tutar }
        return { ...guncellenmis, bakiye: hesaplaBakiyeLocal(guncellenmis) }
      })
    }

    yeniVeriler.sabit_giderler = yeniVeriler.sabit_giderler?.map((sg) =>
      sg.id === gider.id
        ? { ...sg, son_islem_tarihi: format(bugun, 'yyyy-MM') }
        : sg
    )
    islemYapildi = true
  }

  return { veriler: yeniVeriler, islemYapildi }
}

function formatPara(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(tutar)
}

