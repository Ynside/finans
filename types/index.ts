export interface Taksit {
  tutar: number;
  vade_tarihi: string; // DD.MM.YYYY formatında
  odendi: boolean;
}

export interface Borc {
  id: number;
  aciklama: string;
  toplam: number;
  aylik: number;
  taksitler: Taksit[];
}

export interface Maaş {
  tutar: number;
  gun: number; // 1-31 arası
}

export interface OdemeGecmisi {
  borc_id: number;
  taksit_index: number;
  tutar: number;
  tarih: string;
}

export interface FinansalDurum {
  nakit: number;
  toplam_borc: number;
  net: number;
  bu_ay_odeme: number;
  kalan: number;
  kredi_karti_borcu?: number;
}

export interface Bildirim {
  tip: 'danger' | 'warning' | 'success' | 'info';
  mesaj: string;
}

export interface ProjeksiyonAyi {
  ay: string;
  baslangic: number;
  gelir: number;
  gider: number;
  kredi_taksit: number;
  net_fark: number;
  bitis: number;
}

export interface KrediHesaplama {
  aylik_taksit: number;
  toplam_odeme: number;
  toplam_faiz: number;
}

export interface YaklasanOdeme {
  odeme_tipi?: 'borc' | 'kredi_karti';
  aciklama: string;
  tutar: number;
  vade: Date;
  vade_str: string;
  fark: number; // gün cinsinden
  // Borç ödemeleri için
  borc?: Borc;
  taksit?: Taksit;
  taksit_index?: number;
  // Kredi kartı ödemeleri için
  kredi_karti?: KrediKarti;
  kredi_karti_detay?: string;
}

export interface BudgetGoal {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline: string;
}

export interface OdemePlani {
  baslangic: string // "YYYY-MM"
  aylar: number[]   // Aylık ödeme tutarları
}

export interface Harcama {
  id: number;
  aciklama: string;
  tutar: number;
  tarih: string; // DD.MM.YYYY
  tip: 'nakit' | 'kredi_karti';
  kategori?: string;
  kredi_karti_id?: number;
  taksitlendirme?: {
    taksit_sayisi: number;
    aylik_tutar: number;
    baslangic_tarihi: string; // DD.MM.YYYY
  };
}

export interface KrediKartiTaksit {
  id: number;
  aciklama: string;
  toplam_tutar: number;
  aylik_tutar: number;
  kalan_taksit: number;
  toplam_taksit: number;
  baslangic_tarihi: string; // DD.MM.YYYY
  sonraki_taksit_tarihi: string; // DD.MM.YYYY
  aylik_odemeler?: number[]; // Her ay için özel tutar (uzunluk = kalan_taksit)
  harcama_id?: number; // HarcamaEkleModal tarafından eklendiyse kaynak harcama id'si
}

export interface TaksitPlani {
  id: number;
  aciklama: string;           // "Samsung TV"
  toplam_tutar: number;       // 10000
  toplam_taksit: number;      // 12
  kalan_taksit: number;       // 9
  baslangic: string;          // "2026-04" — ilk kalan taksit ayı (YYYY-MM)
  aylik_tutar: number;        // 833 (genellikle toplam_tutar / toplam_taksit)
  aylik_odemeler?: number[];  // Özel plan (length = kalan_taksit)
  harcama_id?: number;        // HarcamaEkleModal'dan eklendiyse kaynak harcama id'si
}

export interface KrediKarti {
  id: number;
  ad: string;
  ekstre_kesim_gunu: number; // 1-31
  son_odeme_gunu: number; // Ekstre kesiminden kaç gün sonra
  limit?: number;
  bakiye: number; // Ödenmemiş toplam tutar (hesaplaBakiye() ile otomatik)
  donem_borcu?: number; // Kilitli ekstre borcu (bir sonraki son ödeme tarihinde ödenecek)
  donem_ici_harcama?: number; // Bu dönem yapılan harcamalar (henüz ekstrede yok)
  asgari_odeme_orani?: number; // % (örn: 20 = %20)
  faiz_orani?: number; // Aylık faiz oranı % (örn: 2.5 = %2.5)
  taksit_planlari?: TaksitPlani[]; // Ayrı ayrı taksit planları (yeni format)
  taksitler?: KrediKartiTaksit[]; // Eski format (deprecated)
  odeme_plani?: OdemePlani; // Eski birleşik taksit planı (deprecated, backward compat)
}

export interface EkGelir {
  id: number;
  aciklama: string;
  tutar: number;
  gun: number; // 1-31
  son_ekleme_tarihi: string | null; // YYYY-MM
}

export interface SabitGider {
  id: number;
  aciklama: string;
  tutar: number;
  gun: number; // 1-31, ödeme günü
  tip: 'nakit' | 'kredi_karti';
  kredi_karti_id?: number; // tip === 'kredi_karti' ise
  son_islem_tarihi: string | null; // YYYY-MM
  kategori?: string;
}

export interface FinansalVeriler {
  nakit_bakiye: number;
  borclar: Borc[];
  maas: Maaş;
  son_maas_tarihi: string | null; // YYYY-MM formatında
  odeme_gecmisi: OdemeGecmisi[];
  hedefler?: BudgetGoal[];
  harcamalar?: Harcama[];
  kredi_kartlari?: KrediKarti[];
  ek_gelirler?: EkGelir[];
  sabit_giderler?: SabitGider[];
}

