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
    const res = await fetch('/api/reminders/check')
    const data = await res.json()
    if (data.reminders && data.reminders.length > 0) {
      for (const reminder of data.reminders) {
        self.registration.showNotification(reminder.title, {
          body: reminder.body,
          tag: reminder.tag,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [200, 100, 200],
        })
      }
    }
  } catch (e) {
    console.error('Error checking reminders:', e)
  }
}, 60000)
