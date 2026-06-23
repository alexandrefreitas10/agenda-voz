self.addEventListener('push', event => {
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
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})

// Verificar lembretes a cada minuto
setInterval(async () => {
  try {
    const res = await fetch('/api/cron')
    if (res.ok) {
      const data = await res.json()
      console.log(`✓ Checked reminders: ${data.sent || 0} notified`)
    }
  } catch (e) {
    console.error('Error checking reminders:', e)
  }
}, 60000)
