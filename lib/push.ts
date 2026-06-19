import webpush from 'web-push'

function getWebPush() {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL ?? 'admin@agenda.local'),
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  return webpush
}

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body?: string; tag?: string },
) {
  const wp = getWebPush()
  try {
    await wp.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
    )
    return true
  } catch (e: any) {
    if (e.statusCode === 410 || e.statusCode === 404) return false
    throw e
  }
}
