'use client'

import { formatPara } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { saveData } from '@/lib/storage'
import type { FinansalVeriler, Borc } from '@/types'

interface TaksitlerModalProps {
  isOpen: boolean
  onClose: () => void
  borc: Borc
  veriler: FinansalVeriler
  onUpdate: (veriler: FinansalVeriler) => void
}

export function TaksitlerModal({
  isOpen,
  onClose,
  borc,
  veriler,
  onUpdate,
}: TaksitlerModalProps) {
  const handleOdeme = (taksitIndex: number) => {
    const taksit = borc.taksitler[taksitIndex]
    
    if (!confirm(`${formatPara(taksit.tutar)} ödemek istediğinize emin misiniz?\n\n⚠️ Bu tutar nakit bakiyenizden düşülecektir.`)) {
      return
    }

    const yeniVeriler: FinansalVeriler = {
      ...veriler,
      nakit_bakiye: veriler.nakit_bakiye - taksit.tutar,
      borclar: veriler.borclar.map((b) =>
        b.id === borc.id
          ? {
              ...b,
              taksitler: b.taksitler.map((t, idx) =>
                idx === taksitIndex ? { ...t, odendi: true } : t
              ),
            }
          : b
      ),
      odeme_gecmisi: [
        ...veriler.odeme_gecmisi,
        {
          borc_id: borc.id,
          taksit_index: taksitIndex,
          tutar: taksit.tutar,
          tarih: new Date().toLocaleString('tr-TR'),
        },
      ],
    }

    saveData(yeniVeriler)
    onUpdate(yeniVeriler)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📋 ${borc.aciklama} - Taksitler`}
      size="lg"
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {borc.taksitler.map((taksit, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${
              taksit.odendi
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-gray-800 border border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold text-white">{idx + 1}. Taksit</span>
                <span className="text-gray-300">{taksit.vade_tarihi}</span>
                <span className="font-bold text-white">{formatPara(taksit.tutar)}</span>
              </div>
              {taksit.odendi ? (
                <span className="text-success font-bold">✅ Ödendi</span>
              ) : (
                <Button onClick={() => handleOdeme(idx)} variant="success" size="sm">
                  💰 Öde
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}





