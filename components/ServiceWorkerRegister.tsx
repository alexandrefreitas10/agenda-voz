'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('✓ Service Worker registered:', reg)

        // Disparar notificação de teste após 2 segundos
        setTimeout(async () => {
          try {
            if (Notification.permission === 'granted' && reg.active) {
              reg.active.postMessage({ type: 'SHOW_TEST_NOTIFICATION' })
            }
          } catch (e) {
            console.error('Error showing test notification:', e)
          }
        }, 2000)
      }).catch(err => {
        console.error('✗ Service Worker registration failed:', err)
      })
    }
  }, [])

  return null
}
