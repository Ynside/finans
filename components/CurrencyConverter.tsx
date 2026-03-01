'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPara } from '@/lib/utils'

interface ExchangeRate {
  USD: number
  EUR: number
}

export function CurrencyConverter() {
  const [rates, setRates] = useState<ExchangeRate>({
    USD: 34.50,
    EUR: 37.20,
  })
  const [loading, setLoading] = useState(false)

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY').catch(() => null)
      
      if (response?.ok) {
        const data = await response.json()
        setRates({
          USD: 1 / data.rates.USD,
          EUR: 1 / data.rates.EUR,
        })
      }
    } catch {
      // Fallback değerler zaten set edilmiş
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRates()
  }, [])

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-primary-muted">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-primary-muted">USD/TRY</span>
            <span className="text-sm font-light text-white">{formatPara(rates.USD)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-primary-muted">EUR/TRY</span>
            <span className="text-sm font-light text-white">{formatPara(rates.EUR)}</span>
          </div>
        </div>
      )}
      <Button onClick={fetchRates} variant="ghost" size="sm" className="w-full" disabled={loading}>
        <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        Yenile
      </Button>
    </div>
  )
}
