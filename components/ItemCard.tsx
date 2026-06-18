'use client'

import { useState } from 'react'

interface Item {
  id: number
  type: 'appointment' | 'task'
  title: string
  description: string
  date: string | null
  time: string | null
  reminder_at: string | null
  completed: boolean
}

interface Props {
  item: Item
  onComplete: (id: number) => void
  onDelete: (id: number) => void
  onUpdateReminder: (id: number, reminderAt: string | null) => void
}

function formatDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatTime(t: string | null) {
  if (!t) return null
  return t.slice(0, 5)
}

function formatReminderAt(r: string | null) {
  if (!r) return null
  return new Date(r).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ItemCard({ item, onComplete, onDelete, onUpdateReminder }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [reminderDate, setReminderDate] = useState(
    item.reminder_at ? new Date(item.reminder_at).toISOString().slice(0, 16) : ''
  )

  function handleSaveReminder() {
    onUpdateReminder(item.id, reminderDate ? new Date(reminderDate).toISOString() : null)
    setShowEdit(false)
  }

  return (
    <div className={`bg-zinc-900 border rounded-2xl px-4 py-3.5 transition-all ${item.completed ? 'opacity-50 border-zinc-800' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onComplete(item.id)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
            item.completed ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-orange-400'
          }`}
        >
          {item.completed && <span className="text-white text-xs">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${item.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
            {item.title}
          </p>
          {item.description && (
            <p className="text-zinc-500 text-xs mt-0.5">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {item.type === 'appointment' && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">📅 Compromisso</span>
            )}
            {item.date && (
              <span className="text-zinc-400 text-xs">{formatDate(item.date)}</span>
            )}
            {item.time && (
              <span className="text-orange-400 text-xs font-semibold">{formatTime(item.time)}</span>
            )}
          </div>

          {/* Lembrete */}
          <div className="mt-2">
            {item.reminder_at ? (
              <button
                onClick={() => setShowEdit(v => !v)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                🔔 <span>{formatReminderAt(item.reminder_at)}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowEdit(v => !v)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                + Definir lembrete
              </button>
            )}
          </div>

          {showEdit && (
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button onClick={handleSaveReminder} className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg">Salvar</button>
              {item.reminder_at && (
                <button onClick={() => { onUpdateReminder(item.id, null); setShowEdit(false) }} className="text-xs text-red-400 hover:text-red-300">Remover</button>
              )}
              <button onClick={() => setShowEdit(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Cancelar</button>
            </div>
          )}
        </div>

        <button onClick={() => onDelete(item.id)} className="text-zinc-700 hover:text-red-400 transition-colors shrink-0 text-xs mt-0.5">✕</button>
      </div>
    </div>
  )
}
