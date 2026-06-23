'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MicButton from '@/components/MicButton'
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

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [lastTranscription, setLastTranscription] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/items')
    setItems(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function enablePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const { publicKey } = await fetch('/api/push/subscribe').then(r => r.json())
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    })
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
    setPushEnabled(true)
  }

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  function handleVoiceResult(item: Item, transcription: string) {
    setItems(prev => [item, ...prev])
    setLastTranscription(transcription)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  async function handleComplete(id: number) {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleDelete(id: number) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleUpdateReminder(id: number, reminderAt: string | null) {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminder_at: reminderAt }),
    })
    const updated = await res.json()
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  function handleUpdate(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  function handleCreated(item: Item) {
    setItems(prev => [item, ...prev])
  }

  const today = todayStr()
  const todayItems = items.filter(i => i.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const upcomingItems = items.filter(i => i.date && i.date > today).sort((a, b) => a.date!.localeCompare(b.date!))
  const tasks = items.filter(i => !i.date)

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm">{formatGreeting()}</p>
          <h1 className="text-2xl font-black text-white">Minha Agenda</h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
        >
          + Adicionar
        </button>
      </div>

      {/* Push notifications banner */}
      {!pushEnabled && (
        <div className="mx-4 mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-zinc-400 text-xs">Ative notificações para receber lembretes</p>
          <button onClick={enablePush} className="text-xs font-bold text-orange-400 hover:text-orange-300 shrink-0">Ativar</button>
        </div>
      )}

      {/* Success feedback */}
      {showSuccess && (
        <div className="mx-4 mb-4 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
          <p className="text-green-400 text-xs font-semibold">✓ Agendado com sucesso!</p>
          {lastTranscription && <p className="text-zinc-500 text-xs mt-0.5 italic">"{lastTranscription}"</p>}
        </div>
      )}

      <div className="px-4 space-y-6">
        {/* Hoje */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Hoje</h2>
          {loading ? (
            <p className="text-zinc-600 text-sm">Carregando...</p>
          ) : todayItems.length === 0 ? (
            <p className="text-zinc-700 text-sm">Nenhum compromisso hoje.</p>
          ) : (
            <div className="space-y-2">
              {todayItems.map(i => (
                <ItemCard key={i.id} item={i} onComplete={handleComplete} onDelete={handleDelete} onUpdateReminder={handleUpdateReminder} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </section>

        {/* Próximos */}
        {upcomingItems.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Próximos</h2>
            <div className="space-y-2">
              {upcomingItems.slice(0, 3).map(i => (
                <ItemCard key={i.id} item={i} onComplete={handleComplete} onDelete={handleDelete} onUpdateReminder={handleUpdateReminder} onUpdate={handleUpdate} />
              ))}
              {upcomingItems.length > 3 && (
                <Link href="/agenda" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 py-2">
                  Ver mais {upcomingItems.length - 3} compromissos →
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Tarefas */}
        {tasks.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Tarefas pendentes</h2>
            <div className="space-y-2">
              {tasks.slice(0, 5).map(i => (
                <ItemCard key={i.id} item={i} onComplete={handleComplete} onDelete={handleDelete} onUpdateReminder={handleUpdateReminder} onUpdate={handleUpdate} />
              ))}
              {tasks.length > 5 && (
                <Link href="/tarefas" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 py-2">
                  Ver mais {tasks.length - 5} tarefas →
                </Link>
              )}
            </div>
          </section>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          defaultDate={todayStr()}
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Navbar bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-md mx-auto flex items-end justify-around px-6 py-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs font-semibold">Hoje</span>
          </Link>

          {/* Mic central */}
          <div className="-mt-8">
            <MicButton onResult={handleVoiceResult} />
          </div>

          <Link href="/agenda" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
            </svg>
            <span className="text-xs">Agenda</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
