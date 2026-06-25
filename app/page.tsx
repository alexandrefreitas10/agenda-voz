'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MicButtonTasks from '@/components/MicButtonTasks'

interface DailyTask {
  id: number
  date: string
  time: string | null
  title: string
  completed: boolean
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatDayLabel(dateStr: string) {
  const today = todayStr()
  const tomorrow = addDays(today, 1)
  if (dateStr === today) return 'Hoje'
  if (dateStr === tomorrow) return 'Amanhã'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function formatTime(t: string | null) {
  if (!t) return ''
  return t.slice(0, 5)
}

function formatGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function TarefasPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showInput, setShowInput] = useState(false)
  const [inputText, setInputText] = useState('')
  const [addTime, setAddTime] = useState('')
  const [addTitle, setAddTitle] = useState('')
  const [showSuccess, setShowSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/daily-tasks?date=${selectedDate}`)
    setTasks(await res.json())
    setLoading(false)
  }, [selectedDate])

  useEffect(() => { load() }, [load])

  async function handleVoiceResult(newTasks: DailyTask[], date: string, transcription: string) {
    setSelectedDate(date)
    setShowSuccess(`${newTasks.length} tarefa(s) adicionada(s)`)
    setTimeout(() => setShowSuccess(''), 4000)
    load()
  }

  async function toggleCompleted(task: DailyTask) {
    const newVal = !task.completed
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newVal } : t))
    await fetch(`/api/daily-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: newVal }),
    })
  }

  async function deleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })
  }

  async function addTask() {
    if (!addTitle.trim()) return
    setSaving(true)
    const res = await fetch('/api/daily-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, time: addTime || null, title: addTitle.trim() }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99')))
    setAddTitle('')
    setAddTime('')
    setSaving(false)
  }

  const pending = tasks.filter(t => !t.completed)
  const done = tasks.filter(t => t.completed)
  const allDone = tasks.length > 0 && pending.length === 0

  return (
    <div className="min-h-screen pb-40">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <p className="text-zinc-400 text-sm">{formatGreeting()}, Alexandre</p>
        <h1 className="text-2xl font-black text-white">Tarefas</h1>
      </div>

      {/* Navegação de dia */}
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white text-sm">‹</button>
        <div className="flex-1 text-center">
          <p className="text-white font-bold capitalize">{formatDayLabel(selectedDate)}</p>
          <p className="text-zinc-600 text-xs">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white text-sm">›</button>
      </div>

      {/* Feedback */}
      {showSuccess && (
        <div className="mx-4 mb-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
          <p className="text-green-400 text-xs font-semibold">✓ {showSuccess}</p>
        </div>
      )}

      {/* All done */}
      {allDone && (
        <div className="mx-4 mb-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 text-center">
          <p className="text-orange-400 text-sm font-bold">🎉 Tudo feito!</p>
        </div>
      )}

      {/* Lista */}
      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-zinc-600 text-sm text-center py-8">Carregando...</p>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-zinc-700 text-sm">Nenhuma tarefa para {formatDayLabel(selectedDate).toLowerCase()}.</p>
            <p className="text-zinc-800 text-xs mt-1">Grave com o microfone ou adicione manualmente.</p>
          </div>
        ) : (
          <>
            {pending.map(task => (
              <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => toggleCompleted(task)}
                  className="w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-orange-400 shrink-0 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  {task.time && <p className="text-orange-400 text-xs font-bold mb-0.5">{formatTime(task.time)}</p>}
                  <p className="text-white text-sm">{task.title}</p>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-zinc-700 hover:text-red-400 text-xs shrink-0">✕</button>
              </div>
            ))}

            {done.length > 0 && (
              <>
                <p className="text-zinc-700 text-xs uppercase tracking-wider pt-2 px-1">Concluídas</p>
                {done.map(task => (
                  <div key={task.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-4 py-3 flex items-center gap-3 opacity-50">
                    <button
                      onClick={() => toggleCompleted(task)}
                      className="w-5 h-5 rounded-full bg-green-500 border-2 border-green-500 shrink-0 flex items-center justify-center"
                    >
                      <span className="text-white text-xs">✓</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      {task.time && <p className="text-zinc-600 text-xs font-bold mb-0.5">{formatTime(task.time)}</p>}
                      <p className="text-zinc-500 text-sm line-through">{task.title}</p>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-zinc-800 hover:text-red-400 text-xs shrink-0">✕</button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Adicionar manualmente */}
      {showInput && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowInput(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl px-5 py-6 space-y-3"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Adicionar tarefa</h2>
              <button onClick={() => setShowInput(false)} className="text-zinc-500">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs text-zinc-500 block mb-1">Horário</label>
                <input type="time" value={addTime} onChange={e => setAddTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-500 block mb-1">Tarefa</label>
                <input value={addTitle} onChange={e => setAddTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  placeholder="Ex: Reunião com João" autoFocus
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <button onClick={addTask} disabled={!addTitle.trim() || saving}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black rounded-2xl text-sm">
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* Navbar com mic */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-md mx-auto px-4 pt-2 pb-4">
          {/* Mic central */}
          <div className="flex justify-center mb-2">
            <MicButtonTasks onResult={handleVoiceResult} />
          </div>
          <div className="flex items-center justify-around">
            <Link href="/" className="flex flex-col items-center gap-1 text-orange-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1l-9-9-9 9z"/></svg>
              <span className="text-xs font-semibold">Tarefas</span>
            </Link>
            <button onClick={() => setShowInput(true)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              <span className="text-xs">+ Manual</span>
            </button>
            <Link href="/compromissos" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
              <span className="text-xs">Compromissos</span>
            </Link>
            <Link href="/financas" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              <span className="text-xs">Finanças</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
