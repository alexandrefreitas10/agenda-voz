'use client'

import { useState } from 'react'
import WhatsAppContact from './WhatsAppContact'

interface Item {
  id: number
  type: 'appointment' | 'task'
  title: string
  description: string
  date: string | null
  time: string | null
  reminder_at: string | null
  completed: boolean
  whatsapp_number?: string | null
  whatsapp_name?: string | null
}

interface Props {
  defaultDate?: string
  onClose: () => void
  onCreated: (item: Item) => void
}

export default function AddItemModal({ defaultDate, onClose, onCreated }: Props) {
  const [type, setType] = useState<'appointment' | 'task'>('appointment')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(defaultDate ?? '')
  const [time, setTime] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [whatsappName, setWhatsappName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('Título obrigatório'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title: title.trim(),
        description: description.trim(),
        date: date || null,
        time: time || null,
        whatsapp_number: whatsappNumber,
        whatsapp_name: whatsappName,
      }),
    })
    const item = await res.json()
    onCreated(item)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl px-5 py-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Novo item</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        {/* Tipo */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('appointment')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'appointment' ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
          >
            📅 Compromisso
          </button>
          <button
            onClick={() => setType('task')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${type === 'task' ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
          >
            ✅ Tarefa
          </button>
        </div>

        {/* Título */}
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Título *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Reunião com equipe"
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Descrição</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalhes opcionais..."
            className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Hora</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <WhatsAppContact
          number={whatsappNumber}
          name={whatsappName}
          onUpdate={setWhatsappNumber && setWhatsappName ? (num, name) => {
            setWhatsappNumber(num)
            setWhatsappName(name)
          } : () => {}}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black rounded-2xl text-sm transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
