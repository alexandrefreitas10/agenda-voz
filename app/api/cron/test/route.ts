import { NextRequest, NextResponse } from 'next/server'
import sql, { initSchema } from '@/lib/db'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== 'test123') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await initSchema()

  const now = new Date()
  console.log('TEST CRON:', now.toISOString())

  const allItems = await sql`SELECT id, title, reminder_at, reminder_notified, completed FROM items WHERE reminder_at IS NOT NULL ORDER BY reminder_at`

  const due = await sql`
    SELECT id, title, reminder_at, reminder_notified FROM items
    WHERE reminder_at IS NOT NULL
      AND reminder_notified = false
      AND reminder_at <= NOW() + INTERVAL '1 minute'
      AND reminder_at >= NOW() - INTERVAL '5 minutes'
      AND completed = false
  `

  return NextResponse.json({
    now: now.toISOString(),
    totalWithReminder: allItems.length,
    allItems: allItems.map(i => ({ ...i, reminder_at: i.reminder_at?.toISOString() })),
    dueSoon: due.length,
    dueItems: due.map(i => ({ ...i, reminder_at: i.reminder_at?.toISOString() })),
  })
}
