export async function checkAndNotifyReminders() {
  try {
    const res = await fetch('/api/cron/test?key=test123')
    const data = await res.json()

    if (data.dueItems && data.dueItems.length > 0) {
      console.log(`Found ${data.dueItems.length} due reminders`)

      // Se Service Worker está ativo, enviar via SW
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_REMINDERS',
          reminders: data.dueItems
        })
      } else if ('Notification' in window && Notification.permission === 'granted') {
        // Senão, mostrar notificações locais
        for (const item of data.dueItems) {
          new Notification(item.title, {
            body: item.reminder_at ? new Date(item.reminder_at).toLocaleString('pt-BR') : 'Lembrete',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `reminder-${item.id}`,
          })
        }
      }
    }
  } catch (e) {
    console.error('Error checking reminders:', e)
  }
}
