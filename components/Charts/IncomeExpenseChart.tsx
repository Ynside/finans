'use client'

import { formatPara } from '@/lib/utils'
import type { ProjeksiyonAyi } from '@/types'

interface IncomeExpenseChartProps {
  projeksiyon: ProjeksiyonAyi[]
}

export function IncomeExpenseChart({ projeksiyon }: IncomeExpenseChartProps) {
  const maxValue = Math.max(
    ...projeksiyon.map((p) => Math.max(p.gelir, p.gider)),
    1000
  )

  return (
    <div className="space-y-4">
      {projeksiyon.slice(0, 6).map((ay, idx) => {
        const gelirYuzde = (ay.gelir / maxValue) * 100
        const giderYuzde = (ay.gider / maxValue) * 100

        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary-muted">{ay.ay}</span>
              <div className="flex gap-4">
                <span className="text-success text-xs">+{formatPara(ay.gelir)}</span>
                <span className="text-danger text-xs">-{formatPara(ay.gider)}</span>
              </div>
            </div>
            <div className="flex gap-0.5 h-4 rounded overflow-hidden">
              <div
                className="bg-success transition-all duration-500"
                style={{ width: `${gelirYuzde}%` }}
              />
              <div
                className="bg-danger transition-all duration-500"
                style={{ width: `${giderYuzde}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

