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
  aciklama: string;
  tutar: number;
  vade: Date;
  vade_str: string;
  fark: number; // gün cinsinden
  borc: Borc;
  taksit: Taksit;
  taksit_index: number;
}

export interface BudgetGoal {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline: string;
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
}

export interface KrediKarti {
  id: number;
  ad: string;
  ekstre_kesim_gunu: number; // 1-31
  son_odeme_gunu: number; // Ekstre kesiminden kaç gün sonra
  limit?: number;
  bakiye: number; // Ödenmemiş tutar
  asgari_odeme_orani?: number; // % (örn: 20 = %20)
  faiz_orani?: number; // Aylık faiz oranı % (örn: 2.5 = %2.5)
  taksitler?: KrediKartiTaksit[]; // Önceki dönemlerden gelen taksitler
}

export interface EkGelir {
  id: number;
  aciklama: string;
  tutar: number;
  gun: number; // 1-31
  son_ekleme_tarihi: string | null; // YYYY-MM
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
}

