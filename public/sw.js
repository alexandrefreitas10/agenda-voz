console.log('[SW] Service Worker loaded')

self.addEventListener('install', event => {
  console.log('[SW] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('[SW] Activated')
  event.waitUntil(clients.claim())
})

self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data)
  if (event.data?.type === 'SHOW_TEST_NOTIFICATION') {
    self.registration.showNotification('✓ Notificações funcionando!', {
      body: 'Sistema de lembretes está ativo',
      tag: 'test-notification',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
    })
  }
})

self.addEventListener('push', event => {
  console.log('[SW] Push received')
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Lembrete', {
      body: data.body ?? '',
      tag: data.tag ?? 'agenda',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked')
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})

// Verificar lembretes a cada minuto
console.log('[SW] Starting reminder checker...')
setInterval(async () => {
  try {
    console.log('[SW] Checking reminders...')
    const res = await fetch('/api/cron')
    if (res.ok) {
      const data = await res.json()
      console.log(`[SW] ✓ Response: sent=${data.sent}, error=${data.error}`)
      if (data.sent > 0) {
        for (let i = 0; i < data.sent; i++) {
          await self.registration.showNotification('🔔 Lembrete!', {
            body: 'Você tem um lembrete agora',
            tag: `reminder-${Date.now()}-${i}`,
            icon: '/icons/icon-192.png',
            vibrate: [200, 100, 200],
          })
        }
      }
    } else {
      console.log(`[SW] ✗ Response status: ${res.status}`)
    }
  } catch (e) {
    console.error('[SW] Error checking reminders:', e)
  }
}, 10000) // Verificar a cada 10 segundos para teste
