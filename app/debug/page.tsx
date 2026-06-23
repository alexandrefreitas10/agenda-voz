'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [status, setStatus] = useState<Record<string, any>>({})

  useEffect(() => {
    const checks = {
      'HTTPS': window.location.protocol === 'https:',
      'Manifest': !!document.querySelector('link[rel="manifest"]'),
      'Service Worker': 'serviceWorker' in navigator,
      'Web App Capable Meta': !!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      'Apple Touch Icon': !!document.querySelector('link[rel="apple-touch-icon"]'),
      'Theme Color': !!document.querySelector('meta[name="theme-color"]'),
      'Viewport': !!document.querySelector('meta[name="viewport"]'),
    }

    setStatus(checks)

    // Tentar verificar se Service Worker está registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        setStatus(prev => ({
          ...prev,
          'Service Worker Registrado': regs.length > 0,
          'SW Details': regs.map(r => ({ scope: r.scope, active: !!r.active }))
        }))
      })
    }

    // Verificar Notification permission
    if ('Notification' in window) {
      setStatus(prev => ({
        ...prev,
        'Notificação Permitida': Notification.permission === 'granted',
        'Notificação Status': Notification.permission
      }))
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🔧 PWA Debug</h1>

      <div className="space-y-4 max-w-2xl">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{key}</span>
              {typeof value === 'boolean' ? (
                <span className={`text-lg ${value ? 'text-green-400' : 'text-red-400'}`}>
                  {value ? '✓' : '✗'}
                </span>
              ) : (
                <code className="text-xs bg-zinc-800 px-2 py-1 rounded">
                  {JSON.stringify(value, null, 2)}
                </code>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h2 className="font-bold mb-2">📋 O que verificar:</h2>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>✓ Todos os itens devem estar verdes</li>
          <li>✓ Se "Notificação Permitida" está ✗, clique em "Ativar" na home</li>
          <li>✓ Se "Service Worker Registrado" está ✗, recarregue a página</li>
          <li>✓ No iPhone, tente: Safari → Compartilhar → "Adicionar à tela inicial"</li>
        </ul>
      </div>

      <div className="mt-6">
        <a href="/" className="text-orange-400 hover:text-orange-300 underline">
          ← Voltar para Home
        </a>
      </div>
    </div>
  )
}
