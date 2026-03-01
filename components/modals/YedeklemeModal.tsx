'use client'

import { useState } from 'react'
import { Download, Upload, CheckCircle2, AlertCircle, Copy } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { exportData, importData } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface YedeklemeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function YedeklemeModal({ isOpen, onClose }: YedeklemeModalProps) {
  const [jsonData, setJsonData] = useState('')
  const [mesaj, setMesaj] = useState<{ tip: 'success' | 'error'; text: string } | null>(null)

  const handleExport = () => {
    try {
      const data = exportData()
      setJsonData(data)
      setMesaj({ tip: 'success', text: 'Veriler başarıyla dışa aktarıldı!' })
    } catch (error) {
      setMesaj({ tip: 'error', text: 'Dışa aktarma hatası: ' + (error as Error).message })
    }
  }

  const handleImport = () => {
    if (!jsonData.trim()) {
      setMesaj({ tip: 'error', text: 'Lütfen JSON verisi girin!' })
      return
    }

    try {
      const success = importData(jsonData)
      if (success) {
        setMesaj({ tip: 'success', text: 'Veriler başarıyla içe aktarıldı! Sayfayı yenileyin.' })
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setMesaj({ tip: 'error', text: 'Veri formatı geçersiz!' })
      }
    } catch (error) {
      setMesaj({ tip: 'error', text: 'İçe aktarma hatası: ' + (error as Error).message })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData)
    setMesaj({ tip: 'success', text: 'Panoya kopyalandı!' })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💾 Veri Yedekleme" size="lg">
      <div className="space-y-6">
        {/* Dışa Aktarma */}
        <Card className="premium-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Verileri Dışa Aktar</h3>
              <p className="text-sm text-white/60">
                Tüm finansal verilerinizi JSON formatında indirin
              </p>
            </div>
            <Button onClick={handleExport} variant="primary" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Dışa Aktar
            </Button>
          </div>
        </Card>

        {/* JSON Verisi */}
        {jsonData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-white/90">JSON Verisi</label>
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Kopyala
              </Button>
            </div>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full h-48 p-3 glass border-2 border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="JSON verisi buraya yapıştırın..."
            />
          </div>
        )}

        {/* İçe Aktarma */}
        <Card className="premium-card p-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white mb-1">Verileri İçe Aktar</h3>
            <p className="text-sm text-white/60">
              Yedeklenmiş JSON verisini buraya yapıştırın
            </p>
          </div>
          <Button
            onClick={handleImport}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            İçe Aktar
          </Button>
        </Card>

        {/* Mesaj */}
        {mesaj && (
          <div
            className={cn(
              'p-4 rounded-xl flex items-center gap-3',
              mesaj.tip === 'success'
                ? 'bg-success/20 border-2 border-success/30'
                : 'bg-danger/20 border-2 border-danger/30'
            )}
          >
            {mesaj.tip === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger" />
            )}
            <p
              className={cn(
                'text-sm font-medium',
                mesaj.tip === 'success' ? 'text-success' : 'text-danger'
              )}
            >
              {mesaj.text}
            </p>
          </div>
        )}

        {/* Uyarı */}
        <div className="p-4 glass rounded-xl border-2 border-warning/30">
          <p className="text-xs text-warning font-medium">
            ⚠️ Dikkat: İçe aktarma işlemi mevcut tüm verilerinizi değiştirecektir!
          </p>
        </div>
      </div>
    </Modal>
  )
}


