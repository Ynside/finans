import type { OdemePlani, KrediKarti } from '@/types'
export type { OdemePlani }

// Kredi kartı bakiyesini bileşenlerden hesapla
export function hesaplaBakiye(kk: Omit<KrediKarti, 'bakiye'> & { bakiye?: number }): number {
  const taksitToplam = (kk.taksit_planlari || []).reduce((sum, tp) => {
    if (tp.aylik_odemeler && tp.aylik_odemeler.length === tp.kalan_taksit) {
      return sum + tp.aylik_odemeler.reduce((s, v) => s + v, 0)
    }
    return sum + tp.aylik_tutar * tp.kalan_taksit
  }, 0)

  // Eski format: taksitler (KrediKartiTaksit[])
  const eskiTaksitToplam = (kk.taksitler || []).reduce((sum, t) => {
    if (t.aylik_odemeler && t.aylik_odemeler.length === t.kalan_taksit) {
      return sum + t.aylik_odemeler.reduce((s, v) => s + v, 0)
    }
    return sum + t.aylik_tutar * t.kalan_taksit
  }, 0)

  return (kk.donem_borcu || 0) + (kk.donem_ici_harcama || 0) + taksitToplam + eskiTaksitToplam
}

// İki ödeme planını ay bazında birleştir (topla)
export function mergePlans(
  existing: OdemePlani | undefined,
  newPlan: OdemePlani
): OdemePlani {
  if (!existing || existing.aylar.length === 0) return newPlan

  const [existYil, existAy] = existing.baslangic.split('-').map(Number)
  const [newYil, newAy] = newPlan.baslangic.split('-').map(Number)

  const existStart = existYil * 12 + existAy - 1
  const newStart = newYil * 12 + newAy - 1
  const globalStart = Math.min(existStart, newStart)
  const globalEnd = Math.max(existStart + existing.aylar.length, newStart + newPlan.aylar.length)

  const merged = new Array(globalEnd - globalStart).fill(0)
  existing.aylar.forEach((t, i) => { merged[existStart - globalStart + i] += t })
  newPlan.aylar.forEach((t, i) => { merged[newStart - globalStart + i] += t })

  const globalYil = Math.floor(globalStart / 12)
  const globalAyNo = (globalStart % 12) + 1
  return {
    baslangic: `${globalYil}-${String(globalAyNo).padStart(2, '0')}`,
    aylar: merged,
  }
}

// Bir ödeme planından belirli tutarları çıkar
export function subtractFromPlan(
  existing: OdemePlani | undefined,
  sub: OdemePlani
): OdemePlani | undefined {
  if (!existing) return undefined

  const [existYil, existAy] = existing.baslangic.split('-').map(Number)
  const [subYil, subAy] = sub.baslangic.split('-').map(Number)

  const existStart = existYil * 12 + existAy - 1
  const subStart = subYil * 12 + subAy - 1
  const offset = subStart - existStart

  const newAylar = [...existing.aylar]
  sub.aylar.forEach((t, i) => {
    const idx = offset + i
    if (idx >= 0 && idx < newAylar.length) {
      newAylar[idx] = Math.max(0, newAylar[idx] - t)
    }
  })

  return { baslangic: existing.baslangic, aylar: newAylar }
}
