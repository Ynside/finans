import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { FinansalVeriler, ProjeksiyonAyi } from '@/types'
import { hesaplaFinansalDurum, projeksiyonHesapla } from './finansal'

export function exportToExcel(veriler: FinansalVeriler) {
  const durum = hesaplaFinansalDurum(veriler)
  const proj = projeksiyonHesapla(veriler)

  // Özet sayfası
  const ozetData = [
    {
      'Nakit Bakiye': durum.nakit,
      'Toplam Borç': durum.toplam_borc,
      'Net Durum': durum.net,
      'Bu Ay Ödeme': durum.bu_ay_odeme,
      Kalan: durum.kalan,
    },
  ]

  // Projeksiyon sayfası
  const projData = proj.map((ay) => ({
    Ay: ay.ay,
    Başlangıç: ay.baslangic,
    Gelir: ay.gelir,
    Gider: ay.gider,
    'Kredi Taksit': ay.kredi_taksit,
    'Net Fark': ay.net_fark,
    Bitiş: ay.bitis,
  }))

  // Excel dosyası oluştur
  const wb = XLSX.utils.book_new()
  const ozetWs = XLSX.utils.json_to_sheet(ozetData)
  const projWs = XLSX.utils.json_to_sheet(projData)

  XLSX.utils.book_append_sheet(wb, ozetWs, 'Özet')
  XLSX.utils.book_append_sheet(wb, projWs, 'Projeksiyon')

  // İndir
  const dosyaAdi = `finansal_rapor_${format(new Date(), 'yyyyMMdd')}.xlsx`
  XLSX.writeFile(wb, dosyaAdi)
}





