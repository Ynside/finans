'use client'

import { Target, Plus } from 'lucide-react'
import { formatPara, parseTutar } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'

interface BudgetGoal {
  id: number
  name: string
  target: number
  current: number
  deadline: string
}

interface BudgetGoalProps {
  goals: BudgetGoal[]
  onAddGoal: (goal: Omit<BudgetGoal, 'id'>) => void
  onDeleteGoal: (id: number) => void
  onUpdateGoal: (id: number, current: number) => void
}

export function BudgetGoalComponent({ goals, onAddGoal, onDeleteGoal, onUpdateGoal }: BudgetGoalProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedTarget = parseTutar(target)
    if (parsedTarget > 0 && name.trim()) {
      onAddGoal({
        name: name.trim(),
        target: parsedTarget,
        current: 0,
        deadline: deadline || new Date().toISOString().split('T')[0],
      })
      setName('')
      setTarget('')
      setDeadline('')
      setModalOpen(false)
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => setModalOpen(true)} variant="ghost" size="sm">
            <Plus className="w-3 h-3 mr-1.5" />
            Yeni Hedef
          </Button>
        </div>

        {goals.length === 0 ? (
          <p className="text-center py-8 text-primary-muted text-xs">Henüz hedef eklenmemiş</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = Math.min((goal.current / goal.target) * 100, 100)
              return (
                <div key={goal.id} className="glass rounded-md p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm truncate mb-1">{goal.name}</h4>
                      <p className="text-xs text-primary-muted">
                        {formatPara(goal.current)} / {formatPara(goal.target)}
                      </p>
                    </div>
                    <Button
                      onClick={() => onDeleteGoal(goal.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 text-primary-muted hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1 mb-2 overflow-hidden">
                    <div
                      className="bg-white h-1 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-primary-muted">
                    <span>{Math.round(progress)}%</span>
                    <span>{formatPara(goal.target - goal.current)} kaldı</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yeni Hedef Ekle" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hedef Adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Acil Durum Fonu"
            required
          />
          <Input
            label="Hedef Tutar (TL)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="50000"
            required
          />
          <Input
            label="Hedef Tarih"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              İptal
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

