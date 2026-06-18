import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@agenda.local'),
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body?: string; tag?: string },
) {
  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
    )
    return true
  } catch (e: any) {
    if (e.statusCode === 410 || e.statusCode === 404) return false // subscription expired
    throw e
  }
}

export { webpush }
