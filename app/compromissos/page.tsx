'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Commitment {
  id: number
  title: string
  description: string
  scheduled_time: string | null
  location: string
  deadline: string | null
  is_open: boolean
  urgency: 'low' | 'medium' | 'high'
  priority: number
  completed: boolean
}

const URGENCY_LABELS = { low: 'Normal', medium: '⚡ Urgente', high: '🔴 Crítico' }
const URGENCY_COLORS = {
  low: 'bg-zinc-800 text-zinc-400',
  medium: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  high: 'bg-red-900/50 text-red-400 border border-red-800',
}

type FormType = {
  title: string; description: string; scheduled_time: string; location: string;
  deadline: string; is_open: boolean; urgency: 'low' | 'medium' | 'high'; priority: number;
}

const emptyForm: FormType = {
  title: '', description: '', scheduled_time: '', location: '',
  deadline: '', is_open: true, urgency: 'low', priority: 1,
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-lg transition-colors ${n <= value ? 'text-orange-400' : 'text-zinc-700'} ${onChange ? 'hover:text-orange-300' : 'cursor-default'}`}>
          ★
        </button>
      ))}
    </div>
  )
}

export default function CompromissosPage() {
  const [items, setItems] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormType>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [done, setDone] = useState<Commitment[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/commitments')
    setItems(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      scheduled_time: form.scheduled_time || null,
      location: form.location.trim(),
      deadline: form.deadline || null,
      is_open: form.is_open,
      urgency: form.urgency,
      priority: form.priority,
    }
    if (editingId) {
      await fetch(`/api/commitments/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    } else {
      await fetch('/api/commitments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    }
    setSaving(false)
    setShowAdd(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    load()
  }

  function openEdit(item: Commitment) {
    setForm({
      title: item.title, description: item.description,
      scheduled_time: item.scheduled_time ?? '', location: item.location,
      deadline: item.deadline ? item.deadline.slice(0, 10) : '',
      is_open: item.is_open, urgency: item.urgency, priority: item.priority,
    })
    setEditingId(item.id)
    setShowAdd(true)
  }

  async function markDone(item: Commitment) {
    await fetch(`/api/commitments/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    })
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este compromisso?')) return
    await fetch(`/api/commitments/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(x => x.id !== id))
  }

  const highItems = items.filter(i => i.urgency === 'high')
  const medItems = items.filter(i => i.urgency === 'medium')
  const lowItems = items.filter(i => i.urgency === 'low')

  function renderItem(item: Commitment) {
    return (
      <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <button onClick={() => markDone(item)}
            className="mt-0.5 w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-green-400 shrink-0 transition-colors" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-white text-sm font-bold">{item.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${URGENCY_COLORS[item.urgency]}`}>
                {URGENCY_LABELS[item.urgency]}
              </span>
            </div>
            <Stars value={item.priority} />
            {item.description && <p className="text-zinc-500 text-xs mt-1">{item.description}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {item.scheduled_time && <p className="text-zinc-500 text-xs">🕐 {item.scheduled_time.slice(0, 5)}</p>}
              {item.location && <p className="text-zinc-500 text-xs">📍 {item.location}</p>}
              {item.deadline && !item.is_open && (
                <p className="text-zinc-500 text-xs">📅 até {new Date(item.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
              )}
              {item.is_open && <p className="text-zinc-600 text-xs">Sem prazo</p>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => openEdit(item)} className="text-zinc-500 hover:text-zinc-300 text-sm">✏️</button>
            <button onClick={() => handleDelete(item.id)} className="text-zinc-700 hover:text-red-400 text-xs">✕</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="px-4 pt-8 pb-4 flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm">Meus</p>
          <h1 className="text-2xl font-black text-white">Compromissos</h1>
        </div>
        <button onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowAdd(true) }}
          className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl">
          + Novo
        </button>
      </div>

      <div className="px-4 space-y-6">
        {loading ? (
          <p className="text-zinc-600 text-sm text-center py-12">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center py-16">Nenhum compromisso pendente.</p>
        ) : (
          <>
            {highItems.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">🔴 Críticos</h2>
                <div className="space-y-2">{highItems.map(renderItem)}</div>
              </section>
            )}
            {medItems.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-3">⚡ Urgentes</h2>
                <div className="space-y-2">{medItems.map(renderItem)}</div>
              </section>
            )}
            {lowItems.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Normal</h2>
                <div className="space-y-2">{lowItems.map(renderItem)}</div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowAdd(false); setEditingId(null) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl px-5 py-6 space-y-3 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-black text-white">{editingId ? 'Editar' : 'Novo compromisso'}</h2>
              <button onClick={() => { setShowAdd(false); setEditingId(null) }} className="text-zinc-500">✕</button>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">O que é *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Consulta médica, Reunião, Renovar CNH..." autoFocus
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Descrição / Observações</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Detalhes importantes..."
                rows={2}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Horário</label>
                <input type="time" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Local</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Onde?"
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Prazo</label>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setForm(f => ({ ...f, is_open: false }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${!form.is_open ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                  📅 Tem prazo
                </button>
                <button onClick={() => setForm(f => ({ ...f, is_open: true, deadline: '' }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${form.is_open ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                  🔓 Sem prazo
                </button>
              </div>
              {!form.is_open && (
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              )}
            </div>

            {/* Urgência */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Urgência</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map(u => (
                  <button key={u} onClick={() => setForm(f => ({ ...f, urgency: u }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors ${form.urgency === u ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                    {URGENCY_LABELS[u]}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioridade */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Prioridade</label>
              <Stars value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))} />
            </div>

            <button onClick={handleSave} disabled={!form.title.trim() || saving}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black rounded-2xl text-sm">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar compromisso'}
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-md mx-auto flex items-center justify-around px-6 py-4">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1l-9-9-9 9z"/></svg>
            <span className="text-xs">Tarefas</span>
          </Link>
          <Link href="/compromissos" className="flex flex-col items-center gap-1 text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            <span className="text-xs font-semibold">Compromissos</span>
          </Link>
          <Link href="/financas" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            <span className="text-xs">Finanças</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
