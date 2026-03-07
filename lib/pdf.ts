import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { FinansalVeriler, FinansalDurum, ProjeksiyonAyi, Harcama } from '@/types'
import { formatPara } from './utils'
import { hesaplaFinansalDurum, projeksiyonHesapla } from './finansal'
import { format, parse, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

// jsPDF standart fontlar Unicode desteklemez, Türkçe karakterleri ASCII'ye dönüştür
function n(text: string): string {
  return String(text)
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
}

function n2(rows: string[][]): string[][] {
  return rows.map(row => row.map(cell => n(cell)))
}

export function exportToPDF(veriler: FinansalVeriler) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const margin = 15
  let y = margin
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Başlık
  doc.setFontSize(20)
  doc.setTextColor(99, 102, 241)
  doc.setFont('helvetica', 'bold')
  doc.text(n('Finansal Rapor'), margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.text(n(`Tarih: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`), margin, y)
  y += 15

  const addPageIfNeeded = () => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = margin
    }
  }

  // Genel Finansal Durum
  const durum = hesaplaFinansalDurum(veriler)
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(n('Genel Finansal Durum'), margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const durumData = n2([
    ['Nakit Bakiye', formatPara(durum.nakit)],
    ['Toplam Borc', formatPara(durum.toplam_borc)],
    ['Net Durum', formatPara(durum.net)],
    ['Bu Ay Odeme', formatPara(durum.bu_ay_odeme)],
    ['Kalan Bakiye', formatPara(durum.kalan)],
  ])

  ;(doc as any).autoTable({
    startY: y,
    head: [['Kalem', 'Tutar']],
    body: durumData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })
  y = (doc as any).lastAutoTable.finalY + 15
  addPageIfNeeded()

  // Bu Ayki Harcamalar
  const bugun = new Date()
  const ayBasi = startOfMonth(bugun)
  const aySonu = endOfMonth(bugun)

  const buAyHarcamalar = (veriler.harcamalar || []).filter((h) => {
    try {
      const [gun, ay, yil] = h.tarih.split('.')
      const harcamaTarihi = new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun))
      return isWithinInterval(harcamaTarihi, { start: ayBasi, end: aySonu })
    } catch {
      return false
    }
  })

  if (buAyHarcamalar.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(n('Bu Ayki Harcamalar'), margin, y)
    y += 8

    const nakitHarcamalar = buAyHarcamalar.filter((h) => h.tip === 'nakit')
    const krediHarcamalar = buAyHarcamalar.filter((h) => h.tip === 'kredi_karti')

    const nakitToplam = nakitHarcamalar.reduce((sum, h) => sum + h.tutar, 0)
    const krediToplam = krediHarcamalar.reduce((sum, h) => sum + h.tutar, 0)

    // Kategori bazlı toplamlar
    const kategoriToplamlari: Record<string, number> = {}
    buAyHarcamalar.forEach((h) => {
      const kategori = h.kategori || 'Diğer'
      kategoriToplamlari[kategori] = (kategoriToplamlari[kategori] || 0) + h.tutar
    })

    // Özet
    const ozetData = n2([
      ['Nakit Harcamalar', formatPara(nakitToplam)],
      ['Kredi Karti Harcamalar', formatPara(krediToplam)],
      ['Toplam Harcama', formatPara(nakitToplam + krediToplam)],
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: [['Kalem', 'Tutar']],
      body: ozetData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [0, 0, 0] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
    addPageIfNeeded()

    // Kategori bazlı
    if (Object.keys(kategoriToplamlari).length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(n('Kategori Bazli Harcamalar'), margin, y)
      y += 8

      const kategoriData = n2(Object.entries(kategoriToplamlari)
        .sort(([, a], [, b]) => b - a)
        .map(([kategori, tutar]) => [kategori, formatPara(tutar)]))

      ;(doc as any).autoTable({
        startY: y,
        head: [['Kategori', 'Tutar']],
        body: kategoriData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })
      y = (doc as any).lastAutoTable.finalY + 10
      addPageIfNeeded()
    }

    // Detaylı harcamalar
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(n('Detayli Harcama Listesi'), margin, y)
    y += 8

    const harcamaData = n2(buAyHarcamalar
      .sort((a, b) => {
        try {
          const tarihA = parse(a.tarih, 'dd.MM.yyyy', new Date())
          const tarihB = parse(b.tarih, 'dd.MM.yyyy', new Date())
          return tarihB.getTime() - tarihA.getTime()
        } catch {
          return 0
        }
      })
      .map((h) => [
        h.tarih,
        h.aciklama || `${h.kategori || 'Diger'} Harcamasi`,
        h.kategori || 'Diger',
        h.tip === 'nakit' ? 'Nakit' : 'Kredi Karti',
        formatPara(h.tutar),
      ]))

    ;(doc as any).autoTable({
      startY: y,
      head: [['Tarih', 'Aciklama', 'Kategori', 'Tip', 'Tutar']],
      body: harcamaData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        4: { halign: 'right' },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 15
    addPageIfNeeded()
  }

  // Borçlar Özeti
  if (veriler.borclar.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(n('Borclar Ozeti'), margin, y)
    y += 8

    const borcData = n2(veriler.borclar.map((borc) => {
      const kalanTutar = borc.taksitler
        .filter((t) => !t.odendi)
        .reduce((sum, t) => sum + t.tutar, 0)
      const odenenTutar = borc.taksitler
        .filter((t) => t.odendi)
        .reduce((sum, t) => sum + t.tutar, 0)
      return [
        borc.aciklama,
        formatPara(borc.toplam),
        formatPara(odenenTutar),
        formatPara(kalanTutar),
        `${borc.taksitler.filter((t) => !t.odendi).length}/${borc.taksitler.length}`,
      ]
    }))

    ;(doc as any).autoTable({
      startY: y,
      head: [['Aciklama', 'Toplam', 'Odenen', 'Kalan', 'Taksit']],
      body: borcData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    })
    y = (doc as any).lastAutoTable.finalY + 15
    addPageIfNeeded()
  }

  // 12 Aylık Projeksiyon
  const projeksiyon = projeksiyonHesapla(veriler)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(n('12 Aylik Projeksiyon'), margin, y)
  y += 8

  const projData = n2(projeksiyon.map((p) => [
    p.ay,
    formatPara(p.baslangic),
    formatPara(p.gelir),
    formatPara(p.gider),
    formatPara(p.net_fark),
    formatPara(p.bitis),
  ]))

  ;(doc as any).autoTable({
    startY: y,
    head: [['Ay', 'Baslangic', 'Gelir', 'Gider', 'Net Fark', 'Bitis']],
    body: projData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  })

  const dosyaAdi = `finansal_rapor_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`

  // Capacitor (mobil) için blob URL, masaüstü için direkt kaydet
  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
  if (isNative) {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = dosyaAdi
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } else {
    doc.save(dosyaAdi)
  }
}
