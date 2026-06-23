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
  onUpdate: (item: Item) => void
}

function normalizeDate(d: string | null) {
  if (!d) return null
  return d.slice(0, 10)
}

function formatDate(d: string | null) {
  const ds = normalizeDate(d)
  if (!ds) return null
  return new Date(ds + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function formatTime(t: string | null) {
  if (!t) return null
  return t.slice(0, 5)
}

function formatReminderAt(r: string | null) {
  if (!r) return null
  return new Date(r).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ItemCard({ item, onComplete, onDelete, onUpdateReminder, onUpdate }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editTitle, setEditTitle] = useState(item.title)
  const [editDescription, setEditDescription] = useState(item.description)
  const [editDate, setEditDate] = useState(item.date ? item.date.slice(0, 10) : '')
  const [editTime, setEditTime] = useState(item.time ? item.time.slice(0, 5) : '')

  const [reminderDate, setReminderDate] = useState(
    item.reminder_at ? new Date(item.reminder_at).toISOString().slice(0, 16) : ''
  )

  function openEdit() {
    setEditTitle(item.title)
    setEditDescription(item.description)
    setEditDate(item.date ? item.date.slice(0, 10) : '')
    setEditTime(item.time ? item.time.slice(0, 5) : '')
    setShowEdit(true)
    setShowReminder(false)
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) return
    setSaving(true)
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim(),
        date: editDate || null,
        time: editTime || null,
      }),
    })
    const updated = await res.json()
    onUpdate(updated)
    setSaving(false)
    setShowEdit(false)
  }

  async function handleSaveReminder() {
    const reminderAt = reminderDate ? new Date(reminderDate).toISOString() : null
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminder_at: reminderAt }),
    })
    const updated = await res.json()
    onUpdate(updated)
    onUpdateReminder(item.id, reminderAt)
    setShowReminder(false)
  }

  return (
    <div className={`bg-zinc-900 border rounded-2xl transition-all ${item.completed ? 'opacity-50 border-zinc-800' : 'border-zinc-800 hover:border-zinc-700'}`}>

      {/* Linha principal */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
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
            {item.date && <span className="text-zinc-400 text-xs">{formatDate(item.date)}</span>}
            {item.time && <span className="text-orange-400 text-xs font-semibold">{formatTime(item.time)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEdit}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm"
            title="Editar"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-zinc-700 hover:text-red-400 transition-colors text-xs"
            title="Excluir"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Lembrete */}
      <div className="px-4 pb-3">
        {item.reminder_at ? (
          <button
            onClick={() => { setShowReminder(v => !v); setShowEdit(false) }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            🔔 <span>{formatReminderAt(item.reminder_at)}</span>
          </button>
        ) : (
          <button
            onClick={() => { setShowReminder(v => !v); setShowEdit(false) }}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            + Definir lembrete
          </button>
        )}
      </div>

      {/* Painel de edição */}
      {showEdit && (
        <div className="border-t border-zinc-800 px-4 py-4 space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Editar</p>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Título</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Descrição</label>
            <input
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Detalhes opcionais..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Data</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Hora</label>
              <input
                type="time"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editTitle.trim()}
              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Painel de lembrete */}
      {showReminder && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Lembrete</p>
          <input
            type="datetime-local"
            value={reminderDate}
            onChange={e => setReminderDate(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <button onClick={handleSaveReminder} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl">Salvar</button>
            {item.reminder_at && (
              <button onClick={() => { onUpdateReminder(item.id, null); setShowReminder(false) }} className="px-3 py-2 text-red-400 hover:text-red-300 text-xs rounded-xl bg-zinc-800">Remover</button>
            )}
            <button onClick={() => setShowReminder(false)} className="px-3 py-2 text-zinc-500 text-xs rounded-xl bg-zinc-800">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
