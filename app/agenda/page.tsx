'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ItemCard from '@/components/ItemCard'
import AddItemModal from '@/components/AddItemModal'

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

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function AgendaContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') ?? toDateStr(new Date()))
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/items')
    setItems(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function handleComplete(id: number) {
    await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: true }) })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleDelete(id: number) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleUpdateReminder(id: number, reminderAt: string | null) {
    const res = await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reminder_at: reminderAt }) })
    const updated = await res.json()
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  function handleUpdate(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  function handleCreated(item: Item) {
    setItems(prev => [...prev, item])
  }

  const selected = new Date(selectedDate + 'T12:00:00')
  const week = Array.from({ length: 7 }, (_, i) => addDays(selected, i - 3))
  const dayItems = items.filter(i => i.date && i.date.slice(0, 10) === selectedDate && i.type === 'appointment')
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  return (
    <div className="min-h-screen pb-32">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-black text-white">Agenda</h1>
      </div>

      {/* Week strip */}
      <div className="px-4 mb-6">
        <div className="flex gap-1 justify-between">
          {week.map(d => {
            const ds = toDateStr(d)
            const hasItems = items.some(i => i.date === ds)
            const isToday = ds === toDateStr(new Date())
            const isSelected = ds === selectedDate
            return (
              <button
                key={ds}
                onClick={() => setSelectedDate(ds)}
                className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-colors ${isSelected ? 'bg-orange-500' : 'bg-zinc-900 hover:bg-zinc-800'}`}
              >
                <span className={`text-xs ${isSelected ? 'text-orange-200' : 'text-zinc-500'}`}>
                  {d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                </span>
                <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : isToday ? 'text-orange-400' : 'text-zinc-300'}`}>
                  {d.getDate()}
                </span>
                {hasItems && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between mt-3">
          <button onClick={() => setSelectedDate(toDateStr(addDays(new Date(selectedDate + 'T12:00:00'), -7)))} className="text-zinc-500 hover:text-white text-sm">← semana ant.</button>
          <button onClick={() => setSelectedDate(toDateStr(new Date()))} className="text-xs text-orange-400 hover:text-orange-300 font-semibold">Hoje</button>
          <button onClick={() => setSelectedDate(toDateStr(addDays(new Date(selectedDate + 'T12:00:00'), 7)))} className="text-zinc-500 hover:text-white text-sm">próx. semana →</button>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
          >
            + Adicionar
          </button>
        </div>
        {dayItems.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center py-12">Nenhum compromisso neste dia.</p>
        ) : (
          <div className="space-y-2">
            {dayItems.map(i => (
              <ItemCard key={i.id} item={i} onComplete={handleComplete} onDelete={handleDelete} onUpdateReminder={handleUpdateReminder} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          defaultDate={selectedDate}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-md mx-auto flex items-center justify-around px-6 py-4">
          <Link href="/" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
            <span className="text-xs">Hoje</span>
          </Link>
          <Link href="/agenda" className="flex flex-col items-center gap-1 text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
            <span className="text-xs font-semibold">Agenda</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <Suspense fallback={null}>
      <AgendaContent />
    </Suspense>
  )
}
