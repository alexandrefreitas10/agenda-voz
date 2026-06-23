'use client'

import { useState } from 'react'

interface Props {
  number: string | null
  name: string | null
  onUpdate: (number: string | null, name: string | null) => void
}

export default function WhatsAppContact({ number, name, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputNumber, setInputNumber] = useState(number || '')
  const [inputName, setInputName] = useState(name || '')

  async function requestContacts() {
    try {
      // @ts-ignore - API experimental
      if (!navigator.contacts) {
        alert('Seu navegador não suporta acesso a contatos. Digite manualmente.')
        return
      }

      // @ts-ignore
      const contacts = await navigator.contacts.select(['tel', 'name'], { multiple: false })

      if (contacts && contacts.length > 0) {
        const contact = contacts[0]
        const tel = contact.tel?.[0]?.replace(/\D/g, '') || ''
        const contactName = contact.name?.[0] || ''

        setInputNumber(tel)
        setInputName(contactName)
      }
    } catch (e: any) {
      console.error('Erro ao acessar contatos:', e)
      alert('Não foi possível acessar os contatos. Digite manualmente.')
    }
  }

  function handleSave() {
    if (!inputNumber.trim()) {
      alert('Digite um número de WhatsApp')
      return
    }

    onUpdate(inputNumber.trim(), inputName.trim() || null)
    setIsEditing(false)
  }

  function handleRemove() {
    onUpdate(null, null)
    setIsEditing(false)
  }

  function openWhatsApp() {
    if (!number) return
    // Remove tudo que não é número
    const cleanNumber = number.replace(/\D/g, '')
    // Abre WhatsApp Web ou app
    window.open(`https://wa.me/${cleanNumber}`, '_blank')
  }

  if (!isEditing && !number) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-bold rounded-xl transition-colors border border-green-800"
      >
        💬 Adicionar WhatsApp
      </button>
    )
  }

  if (!isEditing && number) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={openWhatsApp}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors"
        >
          💬 {name || 'Abrir WhatsApp'}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="px-2 py-2 text-zinc-500 hover:text-zinc-300 text-sm"
        >
          ✏️
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Nome do contato</label>
        <input
          value={inputName}
          onChange={e => setInputName(e.target.value)}
          placeholder="Ex: Maria, João..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-1">Número WhatsApp</label>
        <input
          value={inputNumber}
          onChange={e => setInputNumber(e.target.value)}
          placeholder="Ex: 55 11 99999-9999"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={requestContacts}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          📱 Selecionar de Contatos
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Salvar
        </button>
        {number && (
          <button
            onClick={handleRemove}
            className="px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 text-xs font-bold rounded-lg transition-colors"
          >
            Remover
          </button>
        )}
        <button
          onClick={() => setIsEditing(false)}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
