'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Expense {
  id: number
  month: string
  name: string
  due_day: number | null
  type: 'recurring' | 'installment' | 'single'
  installment_current: number | null
  installment_total: number | null
  amount: string
  owner: 'mine' | 'wife' | 'shared'
  auto_debit: boolean
  status: 'paid' | 'unpaid'
  notes: string
}

const OWNER_LABELS = { mine: '👤 Meu', wife: '👩 Esposa', shared: '👫 Compartilhado' }
const TYPE_LABELS = { recurring: '🔄 Recorrente', installment: '📋 Parcelado', single: '1️⃣ Único' }

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatMonth(m: string) {
  const [year, month] = m.split('-')
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${months[parseInt(month) - 1]} ${year}`
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonthStr(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type FormType = {
  name: string; due_day: string; type: 'recurring' | 'installment' | 'single';
  installment_current: string; installment_total: string;
  amount: string; owner: 'mine' | 'wife' | 'shared'; auto_debit: boolean;
  status: 'paid' | 'unpaid'; notes: string;
}

const emptyForm: FormType = {
  name: '', due_day: '', type: 'recurring',
  installment_current: '', installment_total: '',
  amount: '', owner: 'mine', auto_debit: false, status: 'unpaid', notes: ''
}

export default function FinancasPage() {
  const [month, setMonth] = useState(currentMonth())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormType>({ ...emptyForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [copying, setCopying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/expenses?month=${month}`)
    setExpenses(await res.json())
    setLoading(false)
  }, [month])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.name.trim()) return
    const body = {
      month,
      name: form.name.trim(),
      due_day: form.due_day ? Number(form.due_day) : null,
      type: form.type,
      installment_current: form.installment_current ? Number(form.installment_current) : null,
      installment_total: form.installment_total ? Number(form.installment_total) : null,
      amount: Number(form.amount.replace(',', '.')) || 0,
      owner: form.owner,
      auto_debit: form.auto_debit,
      status: form.status,
      notes: form.notes.trim(),
    }

    if (editingId) {
      await fetch(`/api/expenses/${editingId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    } else {
      await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
    }
    setForm({ ...emptyForm })
    setShowAdd(false)
    setEditingId(null)
    load()
  }

  function openEdit(e: Expense) {
    setForm({
      name: e.name, due_day: e.due_day?.toString() ?? '', type: e.type,
      installment_current: e.installment_current?.toString() ?? '',
      installment_total: e.installment_total?.toString() ?? '',
      amount: Number(e.amount).toFixed(2).replace('.', ','),
      owner: e.owner, auto_debit: e.auto_debit, status: e.status, notes: e.notes,
    })
    setEditingId(e.id)
    setShowAdd(true)
  }

  async function toggleStatus(e: Expense) {
    const newStatus = e.status === 'paid' ? 'unpaid' : 'paid'
    await fetch(`/api/expenses/${e.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    setExpenses(prev => prev.map(x => x.id === e.id ? { ...x, status: newStatus } : x))
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta despesa?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(x => x.id !== id))
  }

  async function copyFromPrevious() {
    const from = prevMonth(month)
    if (!confirm(`Copiar despesas de ${formatMonth(from)} para ${formatMonth(month)}?`)) return
    setCopying(true)
    const res = await fetch('/api/expenses/copy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromMonth: from, toMonth: month })
    })
    const data = await res.json()
    setCopying(false)
    if (data.copied === 0) {
      alert(`Nenhuma despesa encontrada em ${formatMonth(from)}`)
    } else {
      alert(`${data.copied} despesa(s) copiada(s)!`)
      load()
    }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalPaid = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0)
  const totalUnpaid = expenses.filter(e => e.status === 'unpaid').reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <p className="text-zinc-400 text-sm">Controle</p>
        <h1 className="text-2xl font-black text-white">Finanças</h1>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setMonth(prevMonth(month))} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white text-sm">‹</button>
          <span className="text-white font-bold text-base">{formatMonth(month)}</span>
          <button onClick={() => setMonth(nextMonthStr(month))} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white text-sm">›</button>
        </div>
      </div>

      {/* Resumo */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-zinc-500 text-xs mb-1">Total</p>
          <p className="text-white font-black text-sm">{formatAmount(total)}</p>
        </div>
        <div className="bg-green-950/50 border border-green-900 rounded-2xl p-3 text-center">
          <p className="text-green-500 text-xs mb-1">Pago</p>
          <p className="text-green-400 font-black text-sm">{formatAmount(totalPaid)}</p>
        </div>
        <div className="bg-red-950/50 border border-red-900 rounded-2xl p-3 text-center">
          <p className="text-red-500 text-xs mb-1">A pagar</p>
          <p className="text-red-400 font-black text-sm">{formatAmount(totalUnpaid)}</p>
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 flex gap-2 mb-4">
        <button
          onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowAdd(true) }}
          className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl"
        >
          + Nova despesa
        </button>
        <button
          onClick={copyFromPrevious}
          disabled={copying}
          className="flex-1 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm font-bold rounded-xl disabled:opacity-40"
        >
          {copying ? 'Copiando...' : '📋 Copiar mês ant.'}
        </button>
      </div>

      {/* Lista */}
      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-zinc-600 text-sm text-center py-8">Carregando...</p>
        ) : expenses.length === 0 ? (
          <p className="text-zinc-700 text-sm text-center py-12">Nenhuma despesa em {formatMonth(month)}.</p>
        ) : (
          expenses.map(e => (
            <div key={e.id} className={`bg-zinc-900 border rounded-2xl p-4 transition-all ${e.status === 'paid' ? 'border-green-900/50 opacity-70' : 'border-zinc-800'}`}>
              <div className="flex items-start gap-3">
                {/* Checkbox pago */}
                <button
                  onClick={() => toggleStatus(e)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${e.status === 'paid' ? 'bg-green-500 border-green-500' : 'border-zinc-600 hover:border-green-400'}`}
                >
                  {e.status === 'paid' && <span className="text-white text-xs">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold ${e.status === 'paid' ? 'line-through text-zinc-500' : 'text-white'}`}>
                      {e.name}
                    </p>
                    {e.type === 'installment' && e.installment_current && e.installment_total && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                        {e.installment_current}/{e.installment_total}x
                      </span>
                    )}
                    {e.auto_debit && (
                      <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">🤖 Débito auto</span>
                    )}
                    {e.owner === 'wife' && (
                      <span className="text-xs bg-pink-900/50 text-pink-300 px-2 py-0.5 rounded-full">👩 Esposa</span>
                    )}
                    {e.owner === 'shared' && (
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">👫 Compartilhado</span>
                    )}
                  </div>
                  {e.due_day && (
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {e.auto_debit ? `🤖 Débito dia ${e.due_day}` : `📅 Vence dia ${e.due_day}`}
                    </p>
                  )}
                  {e.notes && <p className="text-zinc-600 text-xs mt-0.5 italic">{e.notes}</p>}
                  <p className={`text-base font-black mt-1 ${e.status === 'paid' ? 'text-green-500' : 'text-orange-400'}`}>
                    {formatAmount(e.amount)}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(e)} className="text-zinc-500 hover:text-zinc-300 text-sm">✏️</button>
                  <button onClick={() => handleDelete(e.id)} className="text-zinc-700 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowAdd(false); setEditingId(null) }}>
          <div className="absolute inset-0 bg-black/70" />
          <div
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl px-5 py-6 space-y-3 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-black text-white">{editingId ? 'Editar despesa' : 'Nova despesa'}</h2>
              <button onClick={() => { setShowAdd(false); setEditingId(null) }} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {/* Nome */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Nome *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Aluguel, Netflix, Financiamento..." autoFocus
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {/* Valor + Dia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Valor (R$)</label>
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00" inputMode="decimal"
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">
                  {form.auto_debit ? 'Dia do débito' : 'Dia do vencimento'}
                </label>
                <input value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))}
                  placeholder="Ex: 10" inputMode="numeric" maxLength={2}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Tipo</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['recurring', 'installment', 'single'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors ${form.type === t ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>
                    {t === 'recurring' ? '🔄 Recorrente' : t === 'installment' ? '📋 Parcelado' : '1️⃣ Único'}
                  </button>
                ))}
              </div>
            </div>

            {/* Parcelas */}
            {form.type === 'installment' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Parcela atual</label>
                  <input value={form.installment_current} onChange={e => setForm(f => ({ ...f, installment_current: e.target.value }))}
                    placeholder="1" inputMode="numeric"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Total de parcelas</label>
                  <input value={form.installment_total} onChange={e => setForm(f => ({ ...f, installment_total: e.target.value }))}
                    placeholder="10" inputMode="numeric"
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            )}

            {/* Dono */}
            <div>
              <label className="text-xs text-zinc-500 block mb-2">Responsável</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['mine', 'wife', 'shared'] as const).map(o => (
                  <button key={o} onClick={() => setForm(f => ({ ...f, owner: o }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-colors ${form.owner === o ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>
                    {OWNER_LABELS[o]}
                  </button>
                ))}
              </div>
            </div>

            {/* Etiquetas */}
            <div className="flex gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, auto_debit: !f.auto_debit }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${form.auto_debit ? 'bg-purple-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>
                🤖 Débito automático
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, status: f.status === 'paid' ? 'unpaid' : 'paid' }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${form.status === 'paid' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>
                {form.status === 'paid' ? '✓ Pago' : 'A pagar'}
              </button>
            </div>

            {/* Notas */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Observações</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional..."
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <button onClick={handleSave} disabled={!form.name.trim()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black rounded-2xl text-sm">
              {editingId ? 'Salvar alterações' : 'Adicionar despesa'}
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
          <Link href="/compromissos" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            <span className="text-xs">Compromissos</span>
          </Link>
          <Link href="/financas" className="flex flex-col items-center gap-1 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
            <span className="text-xs font-semibold">Finanças</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
