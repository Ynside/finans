'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { parseTutar, formatPara } from '@/lib/utils'

interface NakitModalProps {
  isOpen: boolean
  onClose: () => void
  tip: 'ekle' | 'cikar'
  mevcutBakiye: number
  onSave: (tutar: number) => void
}

export function NakitModal({ isOpen, onClose, tip, mevcutBakiye, onSave }: NakitModalProps) {
  const [tutar, setTutar] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedTutar = parseTutar(tutar)
    
    if (isNaN(parsedTutar) || parsedTutar <= 0) {
      setError('Geçerli bir tutar girin!')
      return
    }

    if (tip === 'cikar' && parsedTutar > mevcutBakiye) {
      setError('Yetersiz bakiye!')
      return
    }

    onSave(parsedTutar)
    setTutar('')
    setError('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tip === 'ekle' ? '💰 Nakit Ekle' : '💸 Nakit Çıkar'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {tip === 'cikar' && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-400">Mevcut Bakiye</p>
            <p className="text-lg font-bold text-white">{formatPara(mevcutBakiye)}</p>
          </div>
        )}

        <Input
          label={tip === 'ekle' ? 'Eklenecek Tutar (TL)' : 'Çıkarılacak Tutar (TL)'}
          type="text"
          inputMode="decimal"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="0"
          error={error}
          autoFocus
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            İptal
          </Button>
          <Button type="submit" variant={tip === 'ekle' ? 'success' : 'danger'} className="flex-1">
            {tip === 'ekle' ? '💾 Kaydet' : '💸 Çıkar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}





