import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'
import { sendPush } from '@/lib/push'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await initSchema()

  const due = await sql`
    SELECT * FROM items
    WHERE reminder_at IS NOT NULL
      AND reminder_notified = false
      AND reminder_at <= NOW() + INTERVAL '1 minute'
      AND reminder_at >= NOW() - INTERVAL '5 minutes'
      AND completed = false
  `

  if (due.length === 0) return NextResponse.json({ sent: 0 })

  const subscriptions = await sql`SELECT * FROM push_subscriptions`

  let sent = 0
  for (const item of due) {
    for (const sub of subscriptions) {
      const ok = await sendPush(sub as any, {
        title: item.type === 'appointment' ? '📅 ' + item.title : '✅ ' + item.title,
        body: item.time ? `Às ${item.time.slice(0, 5)}` : 'Lembrete da sua tarefa',
        tag: `item-${item.id}`,
      })
      if (!ok) {
        await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`
      }
    }
    await sql`UPDATE items SET reminder_notified = true WHERE id = ${item.id}`
    sent++
  }

  return NextResponse.json({ sent })
}
